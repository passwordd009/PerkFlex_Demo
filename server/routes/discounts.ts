import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { AuthenticatedRequest } from '../middleware/auth'
import { calcDiscountPointsCost } from '../services/points.service'

const router = Router()
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DiscountSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  image_url: z.string().optional(),
  discount_percentage: z.number().int().min(1, 'Minimum 1%').max(100, 'Maximum 100%'),
  item_ids: z.array(z.string().uuid()).min(1, 'At least one item must be selected'),
})

async function resolveBusiness(userId: string) {
  return supabase.from('businesses').select('id').eq('owner_id', userId).maybeSingle()
}

// GET /discounts — list discounts for authenticated business
router.get('/', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!
  try {
    const { data: business, error: bizError } = await resolveBusiness(userId)
    if (bizError) { res.status(500).json({ message: bizError.message }); return }
    if (!business) { res.status(403).json({ message: 'No business found for this account' }); return }

    const { data, error } = await supabase
      .from('discounts')
      .select('*')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false })

    if (error) { res.status(500).json({ message: error.message }); return }
    res.json(data ?? [])
  } catch (e: any) {
    res.status(500).json({ message: e.message || 'Internal server error' })
  }
})

// POST /discounts — create a discount
router.post('/', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!
  const parsed = DiscountSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0].message })
    return
  }

  try {
    const { data: business, error: bizError } = await resolveBusiness(userId)
    if (bizError) { res.status(500).json({ message: bizError.message }); return }
    if (!business) { res.status(403).json({ message: 'No business found for this account' }); return }

    // Look up item prices to calculate points_cost via PR = TIV × p / PPV
    const { data: invItems } = await supabase
      .from('inventory')
      .select('price')
      .in('id', parsed.data.item_ids)

    const prices = (invItems ?? []).map(i => Number(i.price))
    const avgPrice = prices.length > 0
      ? prices.reduce((sum, p) => sum + p, 0) / prices.length
      : 0
    const points_cost = calcDiscountPointsCost(avgPrice, parsed.data.discount_percentage)

    const { data: discount, error: insertError } = await supabase
      .from('discounts')
      .insert({ ...parsed.data, business_id: business.id, points_cost })
      .select('id')
      .single()

    if (insertError) { res.status(500).json({ message: insertError.message }); return }

    res.status(201).json({ id: discount.id, points_cost })
  } catch (e: any) {
    res.status(500).json({ message: e.message || 'Internal server error' })
  }
})

export default router
