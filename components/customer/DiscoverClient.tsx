'use client'

import { useState, useMemo } from 'react'
import { Search, SlidersHorizontal, Bell, Coffee, Utensils, ShoppingBag, Scissors, Dumbbell, Landmark, LayoutGrid } from 'lucide-react'
import { MapView } from '@/components/shared/MapView'
import { PointsBadge } from '@/components/shared/PointsBadge'
import type { Business } from '@/types'

interface DiscountInfo {
  title: string
  discount_percentage: number
  points_cost: number
}

interface Props {
  businesses: Business[]
  discountByBiz: Record<string, DiscountInfo>
}

const CATEGORY_FILTERS = [
  { label: 'All',      icon: LayoutGrid, match: (_: string | null) => true },
  { label: 'Coffee',   icon: Coffee,     match: (c: string | null) => /cafe|coffee|bakery/i.test(c ?? '') },
  { label: 'Food',     icon: Utensils,   match: (c: string | null) => /dining|restaurant|food|bar/i.test(c ?? '') },
  { label: 'Beauty',   icon: Scissors,   match: (c: string | null) => /salon|barber|beauty|spa/i.test(c ?? '') },
  { label: 'Fitness',  icon: Dumbbell,   match: (c: string | null) => /gym|fitness|sport/i.test(c ?? '') },
  { label: 'Shopping', icon: ShoppingBag,match: (c: string | null) => /shop|retail|store|boutique/i.test(c ?? '') },
  { label: 'Services', icon: Landmark,   match: (c: string | null) => /service|bank|finance/i.test(c ?? '') },
]

export function DiscoverClient({ businesses, discountByBiz }: Props) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered = useMemo(() => {
    const filter = CATEGORY_FILTERS.find(f => f.label === activeCategory) ?? CATEGORY_FILTERS[0]
    return businesses.filter(biz => {
      const q = query.toLowerCase()
      const matchesSearch =
        q === '' ||
        biz.name.toLowerCase().includes(q) ||
        biz.category?.toLowerCase().includes(q) ||
        biz.description?.toLowerCase().includes(q)
      const matchesCategory = activeCategory === 'All' || filter.match(biz.category ?? null)
      return matchesSearch && matchesCategory
    })
  }, [businesses, query, activeCategory])

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Full-screen map */}
      <MapView businesses={filtered} discountByBiz={discountByBiz} />

      {/* Floating header overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
        {/* App bar */}
        <div className="flex items-center justify-end px-4 pt-12 pb-2 pointer-events-auto">
          <div className="flex items-center gap-2">
            <PointsBadge />
            <button className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm">
              <Bell className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-4 pb-2 pointer-events-auto">
          <div className="flex items-center gap-3 bg-white rounded-full px-4 py-3 shadow-lg">
            <Search className="h-4 w-4 text-gray-400 shrink-0" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search rewards & shops"
              className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-gray-400"
            />
            <SlidersHorizontal className="h-4 w-4 text-primary shrink-0" />
          </div>
        </div>

        {/* Category chips */}
        <div className="px-4 pointer-events-auto">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORY_FILTERS.map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => setActiveCategory(label)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-colors shadow-sm ${
                  activeCategory === label
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-600'
                }`}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
