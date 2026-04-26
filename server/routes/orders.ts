import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'
import type { AuthenticatedRequest } from '../middleware/auth'
import { districtMiddleware } from '../middleware/district'
import { signQRToken } from '../services/qr.service'
import { calcPointsEarned, calcDiscount, redeemPoints } from '../services/points.service'
import type { CreateOrderRequest } from '../../types'

const router = Router()
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /orders — create a new preorder
router.post('/', districtMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!
  const { businessId, items, notes, rewardId, customerLat, customerLng } =
    req.body as CreateOrderRequest

  if (!businessId || !items?.length) {
    res.status(400).json({ message: 'businessId and items are required' })
    return
  }

  try {
    // Fetch inventory items to verify prices and availability server-side
    const inventoryItemIds = items.map(i => i.inventoryItemId)
    const { data: inventoryItems, error: invError } = await supabase
      .from('inventory')
      .select('id, name, price, quantity, business_id')
      .in('id', inventoryItemIds)

    if (invError || !inventoryItems) {
      res.status(500).json({ message: 'Failed to fetch inventory items' })
      return
    }

    // Validate all items belong to the business and are in stock
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
        res.status(400).json({ message: `Item is out of stock` })
        return
      }
    }

    // Calculate total using server-side prices; snapshot item_name so history needs no join
    let total = 0
    const orderItemsData = items.map(item => {
      const inv = inventoryItems.find(m => m.id === item.inventoryItemId)!
      const subtotal = inv.price * item.quantity
      total += subtotal
      return {
        inventory_item_id: item.inventoryItemId,
        item_name: inv.name,
        quantity: item.quantity,
        unit_price: inv.price,
        subtotal,
      }
    })

    // Apply reward discount if requested
    let pointsRedeemed = 0
    let discount = 0
    if (rewardId) {
      const { data: reward } = await supabase
        .from('rewards')
        .select('points_cost, discount_amount, discount_type, is_active, expires_at')
        .eq('id', rewardId)
        .single()

      if (reward && reward.is_active) {
        const notExpired = !reward.expires_at || new Date(reward.expires_at) > new Date()
        if (notExpired) {
          pointsRedeemed = reward.points_cost
          if (reward.discount_type === 'fixed') {
            discount = reward.discount_amount ?? 0
          } else if (reward.discount_type === 'percentage') {
            discount = total * ((reward.discount_amount ?? 0) / 100)
          } else {
            discount = calcDiscount(pointsRedeemed)
          }
        }
      }
    }

    const finalTotal = Math.max(0, total - discount)
    const pointsEarned = calcPointsEarned(finalTotal)

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: userId,
        business_id: businessId,
        total: finalTotal,
        points_earned: pointsEarned,
        points_redeemed: pointsRedeemed,
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

    // Handle reward redemption
    if (rewardId && pointsRedeemed > 0) {
      try {
        await redeemPoints(userId, order.id, rewardId, pointsRedeemed)
      } catch (e: any) {
        await supabase.from('orders').delete().eq('id', order.id)
        res.status(400).json({ message: e.message })
        return
      }
    }

    // Sign QR token
    const qrToken = signQRToken(order.id, userId)
    await supabase.from('orders').update({ qr_token: qrToken }).eq('id', order.id)

    res.json({ orderId: order.id, qrToken, total: finalTotal, pointsEarned, pointsRedeemed })
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
