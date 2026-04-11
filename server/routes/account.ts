import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'
import type { AuthenticatedRequest } from '../middleware/auth'

const router = Router()

// Service-role client required to delete auth users
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// DELETE /account — permanently deletes the authenticated user and all their data
router.delete('/', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

  if (error) {
    res.status(500).json({ message: `Failed to delete account: ${error.message}` })
    return
  }

  res.json({ success: true })
})

export default router
