import express from 'express'
import cors from 'cors'
import 'dotenv/config'

import ordersRouter from './routes/orders'
import verifyRouter from './routes/verify'
import pointsRouter from './routes/points'
import rewardsRouter from './routes/rewards'
import accountRouter from './routes/account'
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

app.listen(PORT, () => {
  console.log(`PerkFlex API running on http://localhost:${PORT}`)
})

export default app
