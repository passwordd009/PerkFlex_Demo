import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'
import type { AuthenticatedRequest } from '../middleware/auth'

const router = Router()
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /points/balance
router.get('/balance', async (req: AuthenticatedRequest, res) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('points_balance')
    .eq('id', req.userId!)
    .single()

  const { data: history } = await supabase
    .from('points_ledger')
    .select('*')
    .eq('user_id', req.userId!)
    .order('created_at', { ascending: false })
    .limit(20)

  res.json({ balance: profile?.points_balance ?? 0, history: history ?? [] })
})

export default router
