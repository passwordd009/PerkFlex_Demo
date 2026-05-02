'use client'

import Link from 'next/link'
import { ChevronRight, Star } from 'lucide-react'
import type { Business } from '@/types'

interface DiscountInfo {
  title: string
  discount_percentage: number
  points_cost: number
}

interface Props {
  business: Business
  discount: DiscountInfo | null
  onClose: () => void
}

export function BusinessMapCard({ business, discount, onClose }: Props) {
  return (
    <div
      className="bg-white rounded-3xl shadow-2xl overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      {/* Business info row */}
      <div className="flex items-center gap-3 p-4 pb-3">
        {/* Logo / thumbnail */}
        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-primary/10 shrink-0">
          {business.logo_url || business.cover_url ? (
            <img
              src={business.logo_url ?? business.cover_url!}
              alt={business.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-2xl font-black text-primary">{business.name[0]}</span>
            </div>
          )}
        </div>

        {/* Name + reward info */}
        <div className="flex-1 min-w-0">
          <p className="font-black text-foreground text-base leading-tight">{business.name}</p>
          {discount ? (
            <>
              <p className="text-sm text-gray-500 mt-0.5 leading-tight">{discount.title}</p>
              {/* Points progress bar */}
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: '65%' }}
                  />
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-bold text-amber-600">{discount.points_cost} pts</span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400 mt-0.5">
              {business.description ?? 'Visit to earn rewards'}
            </p>
          )}
        </div>
      </div>

      {/* CTA button */}
      <Link href={`/business/${business.id}`}>
        <div className="bg-primary mx-4 mb-4 rounded-2xl flex items-center justify-center gap-2 py-3 cursor-pointer active:opacity-90 transition-opacity">
          <span className="text-white font-bold text-sm tracking-wide uppercase">
            {discount ? 'Claim Today' : 'View Menu'}
          </span>
          <ChevronRight className="h-4 w-4 text-white" />
        </div>
      </Link>
    </div>
  )
}
