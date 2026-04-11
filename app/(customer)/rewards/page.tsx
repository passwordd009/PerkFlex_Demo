'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { rewardsApi, pointsApi } from '@/lib/api'
import { RewardCard } from '@/components/customer/RewardCard'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPoints } from '@/lib/utils'
import { Star } from 'lucide-react'
import type { Reward } from '@/types'

export default function RewardsPage() {
  const { data: rewardsData, isLoading: rewardsLoading } = useQuery({
    queryKey: ['rewards'],
    queryFn: () => rewardsApi.list(),
  })

  const { data: pointsData } = useQuery({
    queryKey: ['points-balance'],
    queryFn: () => pointsApi.balance(),
  })

  const userPoints = pointsData?.balance ?? 0
  const rewards = rewardsData?.rewards ?? []

  return (
    <div className="px-4 pt-12 pb-6">
      <h1 className="text-2xl font-black text-foreground mb-2">Rewards</h1>

      {/* Points balance hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-5 mb-6 text-white"
      >
        <div className="flex items-center gap-2 mb-1">
          <Star className="h-5 w-5 fill-support text-support" />
          <span className="text-sm font-medium opacity-90">Your Balance</span>
        </div>
        <p className="text-4xl font-black">{formatPoints(userPoints)}</p>
        <p className="text-sm opacity-80 mt-1">points available</p>

        <div className="mt-3 text-xs opacity-70">
          10 pts earned per $1 spent · 100 pts = $1 off
        </div>
      </motion.div>

      {/* Rewards list */}
      <h2 className="font-bold text-foreground mb-3">Available Rewards</h2>

      {rewardsLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : rewards.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-12">No rewards available yet</p>
      ) : (
        <div className="space-y-3">
          {rewards.map((reward: Reward, i: number) => (
            <motion.div
              key={reward.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <RewardCard reward={reward} userPoints={userPoints} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Points history */}
      {(pointsData?.history?.length ?? 0) > 0 && (
        <div className="mt-8">
          <h2 className="font-bold text-foreground mb-3">Points History</h2>
          <div className="space-y-2">
            {pointsData!.history.slice(0, 10).map((entry: any) => (
              <div key={entry.id} className="flex justify-between items-center bg-white rounded-xl p-3 border border-gray-100">
                <div>
                  <p className="text-sm font-medium text-foreground capitalize">{entry.type}</p>
                  <p className="text-xs text-gray-400">{new Date(entry.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`font-bold text-sm ${entry.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {entry.amount > 0 ? '+' : ''}{formatPoints(entry.amount)} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
