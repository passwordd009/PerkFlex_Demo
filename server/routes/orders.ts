import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'
import type { AuthenticatedRequest } from '../middleware/auth'
import { districtMiddleware } from '../middleware/district'
import { signQRToken } from '../services/qr.service'
import { calcPointsEarned, redeemPoints } from '../services/points.service'
import type { CreateOrderRequest } from '../../types'

const router = Router()
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /orders — create a new preorder
router.post('/', districtMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!
  const { businessId, items, notes, rewardId, discountId } = req.body as CreateOrderRequest

  if (!businessId || !items?.length) {
    res.status(400).json({ message: 'businessId and items are required' })
    return
  }

  try {
    // Fetch inventory items — verify prices and stock server-side
    const inventoryItemIds = items.map(i => i.inventoryItemId)
    const { data: inventoryItems, error: invError } = await supabase
      .from('inventory')
      .select('id, name, price, quantity, business_id')
      .in('id', inventoryItemIds)

    if (invError || !inventoryItems) {
      res.status(500).json({ message: 'Failed to fetch inventory items' })
      return
    }

    for (const item of items) {
      const inv = inventoryItems.find(m => m.id === item.inventoryItemId)
      if (!inv) {
        res.status(400).json({ message: `Item ${item.inventoryItemId} not found` })
        return
      }
      if (inv.business_id !== businessId) {
        res.status(400).json({ message: 'All items must belong to the same business' })
        return
      }
      if (inv.quantity <= 0) {
        res.status(400).json({ message: `"${inv.name}" is out of stock` })
        return
      }
    }

    // Build order items with item_name snapshot
    let subtotalBeforeDiscount = 0
    const orderItemsData = items.map(item => {
      const inv = inventoryItems.find(m => m.id === item.inventoryItemId)!
      const subtotal = inv.price * item.quantity
      subtotalBeforeDiscount += subtotal
      return {
        inventory_item_id: item.inventoryItemId,
        item_name: inv.name,
        quantity: item.quantity,
        unit_price: inv.price,
        subtotal,
      }
    })

    // Apply points-based discount if customer selected one
    let discountSavings = 0
    let discountPointsCost = 0
    if (discountId) {
      const { data: disc } = await supabase
        .from('discounts')
        .select('id, discount_percentage, points_cost, item_ids, business_id')
        .eq('id', discountId)
        .eq('business_id', businessId)
        .single()

      if (disc && disc.points_cost > 0) {
        // Verify customer balance
        const { data: profile } = await supabase
          .from('profiles')
          .select('points_balance')
          .eq('id', userId)
          .single()

        if (!profile || profile.points_balance < disc.points_cost) {
          res.status(400).json({ message: 'Insufficient points to unlock this discount' })
          return
        }

        // Apply percentage only to items covered by this discount
        const discountableSubtotal = orderItemsData
          .filter(i => disc.item_ids.includes(i.inventory_item_id))
          .reduce((sum, i) => sum + i.subtotal, 0)

        discountSavings = discountableSubtotal * (disc.discount_percentage / 100)
        discountPointsCost = disc.points_cost
      }
    }

    const finalTotal = Math.max(0, subtotalBeforeDiscount - discountSavings)
    const pointsEarned = calcPointsEarned(finalTotal)

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: userId,
        business_id: businessId,
        total: finalTotal,
        points_earned: pointsEarned,
        points_redeemed: discountPointsCost,
        notes,
      })
      .select('id')
      .single()

    if (orderError || !order) {
      res.status(500).json({ message: `Failed to create order: ${orderError?.message}` })
      return
    }

    // Insert order items — rollback order on failure
    const { error: itemsError } = await supabase.from('order_items').insert(
      orderItemsData.map(item => ({ ...item, order_id: order.id }))
    )
    if (itemsError) {
      await supabase.from('orders').delete().eq('id', order.id)
      res.status(500).json({ message: `Failed to create order items: ${itemsError.message}` })
      return
    }

    // Deduct points for discount
    if (discountId && discountPointsCost > 0) {
      const { error: ledgerError } = await supabase.from('points_ledger').insert({
        user_id: userId,
        order_id: order.id,
        type: 'redeemed',
        amount: -discountPointsCost,
        description: `Discount unlocked`,
      })
      if (!ledgerError) {
        await supabase.rpc('increment_points', { p_user_id: userId, p_amount: -discountPointsCost })
      }
    }

    // Deduct points for legacy reward (kept for backward compat)
    if (rewardId) {
      try {
        await redeemPoints(userId, order.id, rewardId, 0)
      } catch (_) {}
    }

    // Sign QR token
    const qrToken = signQRToken(order.id, userId)
    await supabase.from('orders').update({ qr_token: qrToken }).eq('id', order.id)

    res.json({
      orderId: order.id,
      qrToken,
      total: finalTotal,
      pointsEarned,
      pointsRedeemed: discountPointsCost,
    })
  } catch (e: any) {
    console.error('Order creation error:', e)
    res.status(500).json({ message: e.message || 'Internal server error' })
  }
})

// GET /orders — list customer's orders
router.get('/', async (req: AuthenticatedRequest, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, businesses(id, name, logo_url, address), order_items(*)')
    .eq('customer_id', req.userId!)
    .order('created_at', { ascending: false })

  if (error) {
    res.status(500).json({ message: error.message })
    return
  }
  res.json({ orders: data })
})

// GET /orders/:id
router.get('/:id', async (req: AuthenticatedRequest, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, businesses(id, name, logo_url, address), order_items(*)')
    .eq('id', req.params.id)
    .eq('customer_id', req.userId!)
    .single()

  if (error || !data) {
    res.status(404).json({ message: 'Order not found' })
    return
  }
  res.json({ order: data })
})

export default router
