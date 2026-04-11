import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'
import type { AuthenticatedRequest } from '../middleware/auth'
import { verifyQRToken } from '../services/qr.service'
import { awardPoints, calcPointsEarned } from '../services/points.service'

const router = Router()
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /verify/:token — business owner scans a customer QR code
router.post('/:token', async (req: AuthenticatedRequest, res) => {
  if (req.userRole !== 'business_owner') {
    res.status(403).json({ message: 'Only business owners can verify orders' })
    return
  }

  const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token

  try {
    const { orderId, userId } = verifyQRToken(token)

    // Fetch the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, total, points_earned, customer_id, business_id')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      res.status(404).json({ message: 'Order not found' })
      return
    }

    // Verify the customer matches the token
    if (order.customer_id !== userId) {
      res.status(400).json({ message: 'QR token does not match order customer' })
      return
    }

    // Verify the business owner owns the business for this order
    const { data: business } = await supabase
      .from('businesses')
      .select('id, owner_id')
      .eq('id', order.business_id)
      .single()

    if (!business || business.owner_id !== req.userId) {
      res.status(403).json({ message: 'This order does not belong to your business' })
      return
    }

    // Already completed?
    if (order.status === 'completed') {
      res.status(409).json({ message: 'Order has already been verified' })
      return
    }

    if (order.status === 'cancelled') {
      res.status(400).json({ message: 'Cannot verify a cancelled order' })
      return
    }

    // Mark order as completed
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'completed', verified_at: new Date().toISOString() })
      .eq('id', orderId)

    if (updateError) {
      res.status(500).json({ message: 'Failed to update order status' })
      return
    }

    // Award points to customer
    const pointsToAward = order.points_earned
    if (pointsToAward > 0) {
      await awardPoints(userId, orderId, pointsToAward, `Points earned for order #${orderId.slice(0, 8)}`)
    }

    res.json({
      success: true,
      orderId,
      customerId: userId,
      pointsAwarded: pointsToAward,
    })
  } catch (e: any) {
    console.error('QR verify error:', e)
    res.status(400).json({ message: e.message || 'Invalid QR code' })
  }
})

export default router
