import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

import ordersRouter from './routes/orders'
import verifyRouter from './routes/verify'
import pointsRouter from './routes/points'
import rewardsRouter from './routes/rewards'
import accountRouter from './routes/account'
import inventoryRouter from './routes/inventory'
import discountsRouter from './routes/discounts'
import { authMiddleware } from './middleware/auth'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000' }))
app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true }))

// All routes below require a valid Supabase JWT
app.use(authMiddleware)

app.use('/orders', ordersRouter)
app.use('/verify', verifyRouter)
app.use('/points', pointsRouter)
app.use('/rewards', rewardsRouter)
app.use('/account', accountRouter)
app.use('/inventory', inventoryRouter)
app.use('/discounts', discountsRouter)

async function ensureStorageBucket() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: buckets } = await supabase.storage.listBuckets()
    if (!buckets?.find(b => b.name === 'ember')) {
      const { error } = await supabase.storage.createBucket('ember', { public: true })
      if (error) console.error('Failed to create ember bucket:', error.message)
      else console.log('Created ember storage bucket')
    }
  } catch (e) {
    console.error('Storage bucket init error:', e)
  }
}

app.listen(PORT, () => {
  console.log(`Ember API running on http://localhost:${PORT}`)
  ensureStorageBucket()
})

export default app
