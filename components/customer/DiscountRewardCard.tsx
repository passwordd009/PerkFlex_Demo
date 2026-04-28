'use client'

import { Star, Tag } from 'lucide-react'
import type { Discount } from '@/types'

interface Props {
  discount: Discount
  pointsBalance: number
}

export function DiscountRewardCard({ discount, pointsBalance }: Props) {
  const canAfford = pointsBalance >= discount.points_cost
  const needed = discount.points_cost - pointsBalance

  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header area */}
      <div className="w-full h-28 bg-primary/5 flex flex-col items-center justify-center gap-1">
        <Tag className="h-8 w-8 text-primary/40" />
        <span className="text-2xl font-black text-primary">{discount.discount_percentage}%</span>
        <span className="text-[10px] text-gray-400 font-medium">off</span>
      </div>

      <div className="p-3">
        <div className="flex items-center gap-1 mb-0.5">
          <p className="text-sm font-semibold text-foreground leading-tight truncate">{discount.title}</p>
          {discount.is_combo && (
            <span className="flex-shrink-0 text-[9px] font-bold px-1 py-0.5 rounded bg-amber-100 text-amber-700">Combo</span>
          )}
        </div>
        {discount.description && (
          <p className="text-xs text-gray-400 leading-tight mb-1">{discount.description}</p>
        )}

        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-center gap-0.5">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            <span className="text-sm font-bold text-amber-700">{discount.points_cost}</span>
          </div>

          {canAfford ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-white">
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
