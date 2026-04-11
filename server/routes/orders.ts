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
    // Fetch menu items to verify prices server-side
    const menuItemIds = items.map(i => i.menuItemId)
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('id, price, is_available, business_id, points_value')
      .in('id', menuItemIds)

    if (menuError || !menuItems) {
      res.status(500).json({ message: 'Failed to fetch menu items' })
      return
    }

    // Validate all items belong to the business and are available
    for (const item of items) {
      const menuItem = menuItems.find(m => m.id === item.menuItemId)
      if (!menuItem) {
        res.status(400).json({ message: `Menu item ${item.menuItemId} not found` })
        return
      }
      if (menuItem.business_id !== businessId) {
        res.status(400).json({ message: 'All items must belong to the same business' })
        return
      }
      if (!menuItem.is_available) {
        res.status(400).json({ message: `Item "${item.menuItemId}" is not available` })
        return
      }
    }

    // Calculate total using server-side prices
    let total = 0
    const orderItemsData = items.map(item => {
      const menuItem = menuItems.find(m => m.id === item.menuItemId)!
      const subtotal = menuItem.price * item.quantity
      total += subtotal
      return {
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        unit_price: menuItem.price,
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
      res.status(500).json({ message: 'Failed to create order' })
      return
    }

    // Insert order items
    const { error: itemsError } = await supabase.from('order_items').insert(
      orderItemsData.map(item => ({ ...item, order_id: order.id }))
    )
    if (itemsError) {
      res.status(500).json({ message: 'Failed to create order items' })
      return
    }

    // Handle reward redemption
    if (rewardId && pointsRedeemed > 0) {
      try {
        await redeemPoints(userId, order.id, rewardId, pointsRedeemed)
      } catch (e: any) {
        // Roll back order if redemption fails
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
    .select(`
      *,
      businesses(id, name, logo_url, address),
      order_items(*, menu_items(id, name))
    `)
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
    .select(`
      *,
      businesses(id, name, logo_url, address),
      order_items(*, menu_items(id, name, price))
    `)
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
