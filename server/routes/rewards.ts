import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'
import type { AuthenticatedRequest } from '../middleware/auth'

const router = Router()
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

export default router
