'use client'

import { Gift, Star, Lock } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatPoints } from '@/lib/utils'
import type { Reward } from '@/types'

interface RewardCardProps {
  reward: Reward
  userPoints: number
  onRedeem?: (reward: Reward) => void
  /** Already selected in checkout */
  selected?: boolean
}

export function RewardCard({ reward, userPoints, onRedeem, selected }: RewardCardProps) {
  const canAfford = userPoints >= reward.points_cost
  const notExpired = !reward.expires_at || new Date(reward.expires_at) > new Date()
  const redeemable = canAfford && notExpired && reward.is_active

  const discountLabel =
    reward.discount_type === 'fixed'
      ? `${formatCurrency(reward.discount_amount ?? 0)} off`
      : reward.discount_type === 'percentage'
      ? `${reward.discount_amount}% off`
      : `${formatPoints(reward.points_cost)} pts → reward`

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className={`overflow-hidden transition-all ${selected ? 'ring-2 ring-primary' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${canAfford ? 'bg-secondary/10' : 'bg-gray-100'}`}>
              {canAfford ? (
                <Gift className="h-5 w-5 text-secondary" />
              ) : (
                <Lock className="h-5 w-5 text-gray-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-foreground">{reward.name}</p>
              {reward.description && (
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{reward.description}</p>
              )}
              <p className="text-xs font-semibold text-secondary mt-1">{discountLabel}</p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-support text-support" />
              <span className="text-sm font-bold text-amber-700">
                {formatPoints(reward.points_cost)} pts
              </span>
              {!canAfford && (
                <span className="text-xs text-gray-400 ml-1">
                  (need {formatPoints(reward.points_cost - userPoints)} more)
                </span>
              )}
            </div>

            {onRedeem && (
              <Button
                size="sm"
                variant={selected ? 'outline' : 'secondary'}
                disabled={!redeemable}
                onClick={() => onRedeem(reward)}
                className="text-xs h-8"
              >
                {selected ? 'Remove' : 'Redeem'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
