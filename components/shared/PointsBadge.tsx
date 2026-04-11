'use client'

import { Star } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { pointsApi } from '@/lib/api'
import { formatPoints } from '@/lib/utils'

interface PointsBadgeProps {
  /** Show inline with balance number */
  showBalance?: boolean
  className?: string
}

export function PointsBadge({ showBalance = true, className }: PointsBadgeProps) {
  const { data } = useQuery({
    queryKey: ['points-balance'],
    queryFn: () => pointsApi.balance(),
    staleTime: 30_000,
  })

  const balance = data?.balance ?? 0

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full bg-support/20 px-3 py-1 text-amber-700 ${className ?? ''}`}
    >
      <Star className="h-3.5 w-3.5 fill-support text-support" />
      {showBalance && (
        <span className="text-xs font-bold">{formatPoints(balance)} pts</span>
      )}
    </div>
  )
}
