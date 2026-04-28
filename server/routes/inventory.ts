import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { AuthenticatedRequest } from '../middleware/auth'

const router = Router()
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const InventoryItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.number().nonnegative('Price must be 0 or greater'),
  quantity: z.number().int('Quantity must be a whole number').nonnegative('Quantity must be 0 or greater'),
  category: z.string().min(1, 'Category is required'),
})

// GET /inventory — list inventory items for authenticated business
router.get('/', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!
  try {
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle()

    if (bizError) { res.status(500).json({ message: bizError.message }); return }
    if (!business) { res.status(403).json({ message: 'No business found for this account' }); return }

    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('business_id', business.id)
      .order('name')

    if (error) { res.status(500).json({ message: error.message }); return }
    res.json(data ?? [])
  } catch (e: any) {
    res.status(500).json({ message: e.message || 'Internal server error' })
  }
})

// POST /inventory/upload — bulk upsert inventory items from CSV
router.post('/upload', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!

  const { items } = req.body as { items: unknown[] }
  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ message: 'items must be a non-empty array' })
    return
  }

  try {
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle()

    if (bizError) {
      res.status(500).json({ message: `Database error: ${bizError.message}` })
      return
    }
    if (!business) {
      res.status(403).json({ message: 'No business found for this account' })
      return
    }

    const businessId = business.id

    const validItems: Array<{ name: string; price: number; quantity: number; category: string }> = []
    const errors: Array<{ row: number; message: string }> = []

    for (let i = 0; i < items.length; i++) {
      const parsed = InventoryItemSchema.safeParse(items[i])
      if (parsed.success) {
        validItems.push(parsed.data)
      } else {
        const message = parsed.error.issues.map((e: { message: string }) => e.message).join('; ')
        errors.push({ row: i + 1, message })
      }
    }

    if (validItems.length === 0) {
      res.status(422).json({ success_count: 0, error_count: errors.length, errors })
      return
    }

    const CHUNK_SIZE = 100
    for (let start = 0; start < validItems.length; start += CHUNK_SIZE) {
      const chunk = validItems.slice(start, start + CHUNK_SIZE).map(item => ({
        ...item,
        business_id: businessId,
      }))
      const { error: upsertError } = await supabase
        .from('inventory')
        .upsert(chunk, { onConflict: 'business_id,name' })
      if (upsertError) {
        res.status(500).json({ message: `Upload failed: ${upsertError.message}` })
        return
      }
    }

    res.json({ success_count: validItems.length, error_count: errors.length, errors })
  } catch (e: any) {
    console.error('Inventory upload error:', e)
    res.status(500).json({ message: e.message || 'Internal server error' })
  }
})

export default router
