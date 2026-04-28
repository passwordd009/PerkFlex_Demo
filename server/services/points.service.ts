import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const POINTS_RATE = 0.05   // 5% of purchase
const POINTS_CAP  = 20     // max 20 points per transaction

// PR = TIV × p / PPV
// 1 point = $0.01, so 100 points = $1
export const PRICE_PER_POINT = 0.01

export function calcPointsEarned(total: number): number {
  return Math.min(Math.floor(total * POINTS_RATE), POINTS_CAP)
}

export function calcDiscountPointsCost(avgItemPrice: number, discountPercentage: number): number {
  const pr = (avgItemPrice * (discountPercentage / 100)) / PRICE_PER_POINT
  return Math.max(1, Math.round(pr))
}

/**
 * Award points to a user after order completion.
 * Uses two DB writes: ledger entry + balance update (both via service role).
 */
export async function awardPoints(
  userId: string,
  orderId: string,
  amount: number,
  description: string
): Promise<void> {
  // Insert ledger entry
  const { error: ledgerError } = await supabase.from('points_ledger').insert({
    user_id: userId,
    order_id: orderId,
    type: 'earned',
    amount,
    description,
  })
  if (ledgerError) throw new Error(`Ledger insert failed: ${ledgerError.message}`)

  // Update balance
  const { error: balanceError } = await supabase.rpc('increment_points', {
    p_user_id: userId,
    p_amount: amount,
  })
  if (balanceError) throw new Error(`Balance update failed: ${balanceError.message}`)
}

/**
 * Deduct points for reward redemption.
 * Throws if user has insufficient balance.
 */
export async function redeemPoints(
  userId: string,
  orderId: string | null,
  rewardId: string,
  pointsCost: number
): Promise<void> {
  // Check balance
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('points_balance')
    .eq('id', userId)
    .single()

  if (profileError || !profile) throw new Error('User profile not found')
  if (profile.points_balance < pointsCost) throw new Error('Insufficient points balance')

  // Insert ledger entry
  const { error: ledgerError } = await supabase.from('points_ledger').insert({
    user_id: userId,
    order_id: orderId,
    type: 'redeemed',
    amount: -pointsCost,
    description: `Reward redemption`,
  })
  if (ledgerError) throw new Error(`Ledger insert failed: ${ledgerError.message}`)

  // Deduct balance
  const { error: balanceError } = await supabase.rpc('increment_points', {
    p_user_id: userId,
    p_amount: -pointsCost,
  })
  if (balanceError) throw new Error(`Balance deduction failed: ${balanceError.message}`)

  // Record redemption
  const { error: redemptionError } = await supabase.from('reward_redemptions').insert({
    user_id: userId,
    reward_id: rewardId,
    order_id: orderId,
    points_spent: pointsCost,
  })
  if (redemptionError) throw new Error(`Redemption record failed: ${redemptionError.message}`)
}
