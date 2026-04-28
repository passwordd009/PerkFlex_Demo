import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { AuthenticatedRequest } from '../middleware/auth'

const router = Router()
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const RewardSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  points_cost: z.number().int().min(1, 'Points cost must be greater than 0'),
})

async function resolveBusiness(userId: string) {
  return supabase.from('businesses').select('id').eq('owner_id', userId).maybeSingle()
}

// GET /rewards — list active rewards (optionally filtered by business)
router.get('/', async (req: AuthenticatedRequest, res) => {
  const { businessId } = req.query as { businessId?: string }

  let query = supabase
    .from('rewards')
    .select('*, businesses(id, name, logo_url)')
    .eq('is_active', true)

  if (businessId) {
    query = query.eq('business_id', businessId)
  }

  const { data, error } = await query.order('points_cost')

  if (error) {
    res.status(500).json({ message: error.message })
    return
  }
  res.json({ rewards: data ?? [] })
})

// POST /rewards — create a reward (business owner only)
router.post('/', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!
  const parsed = RewardSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0].message })
    return
  }

  try {
    const { data: business, error: bizError } = await resolveBusiness(userId)
    if (bizError) { res.status(500).json({ message: bizError.message }); return }
    if (!business) { res.status(403).json({ message: 'No business found for this account' }); return }

    const { name, description, points_cost } = parsed.data
    const { data: reward, error: insertError } = await supabase
      .from('rewards')
      .insert({ name, description, points_cost, business_id: business.id, is_active: true })
      .select('id')
      .single()

    if (insertError) { res.status(500).json({ message: insertError.message }); return }

    res.status(201).json({ id: reward.id })
  } catch (e: any) {
    res.status(500).json({ message: e.message || 'Internal server error' })
  }
})

export default router
