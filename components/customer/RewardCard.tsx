'use client'

import { Star, Gift } from 'lucide-react'
import type { Reward } from '@/types'

interface RewardCardProps {
  reward: Reward
  pointsBalance: number
}

export function RewardCard({ reward, pointsBalance }: RewardCardProps) {
  const canAfford = pointsBalance >= reward.points_cost
  const needed = reward.points_cost - pointsBalance

  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Icon area */}
      <div className="w-full h-28 bg-amber-50 flex items-center justify-center">
        <Gift className="h-10 w-10 text-amber-400" />
      </div>

      <div className="p-3">
        <p className="text-sm font-semibold text-foreground leading-tight">{reward.name}</p>
        {reward.description && (
          <p className="text-xs text-gray-400 mt-0.5 leading-tight">{reward.description}</p>
        )}

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-0.5">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            <span className="text-sm font-bold text-amber-700">{reward.points_cost}</span>
          </div>

          {canAfford ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              Unlock
            </span>
          ) : (
            <span className="text-[10px] text-gray-400 font-medium">
              Need {needed} more
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
