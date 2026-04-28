'use client'

import { Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Reward } from '@/types'

interface RewardCardProps {
  reward: Reward
  pointsBalance: number
}

export function RewardCard({ reward, pointsBalance }: RewardCardProps) {
  const canAfford = pointsBalance >= reward.points_cost
  const needed = reward.points_cost - pointsBalance

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-foreground">{reward.name}</p>
            {reward.description && (
              <p className="text-xs text-gray-500 mt-0.5">{reward.description}</p>
            )}
            <div className="flex items-center gap-1 mt-2">
              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              <span className="text-sm font-bold text-amber-700">{reward.points_cost} pts</span>
            </div>
          </div>

          <div className="flex-shrink-0">
            {canAfford ? (
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white text-xs h-8">
                Unlock
              </Button>
            ) : (
              <span className="text-xs text-gray-400 font-medium">
                Need {needed} more pts
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
