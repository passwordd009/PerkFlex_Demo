'use client'

import { useState, useMemo } from 'react'
import { Search, SlidersHorizontal, Bell } from 'lucide-react'
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

export function DiscoverClient({ businesses, discountByBiz }: Props) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('Explore All')

  const categories = useMemo(() => {
    const cats = Array.from(
      new Set(businesses.map(b => b.category).filter((c): c is string => !!c))
    )
    return ['Explore All', ...cats]
  }, [businesses])

  const filtered = useMemo(() => {
    return businesses.filter(biz => {
      const q = query.toLowerCase()
      const matchesSearch =
        q === '' ||
        biz.name.toLowerCase().includes(q) ||
        biz.category?.toLowerCase().includes(q) ||
        biz.description?.toLowerCase().includes(q)

      const matchesCategory =
        activeCategory === 'Explore All' ||
        biz.category?.toLowerCase() === activeCategory.toLowerCase()

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
        <div className="flex items-center justify-between px-4 pt-12 pb-2 pointer-events-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-black text-sm">E</span>
            </div>
            <span className="text-lg font-black text-foreground">Ember</span>
          </div>
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
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-colors shadow-sm ${
                  activeCategory === cat
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
