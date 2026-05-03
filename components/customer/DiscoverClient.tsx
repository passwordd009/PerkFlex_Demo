'use client'

import { useState, useMemo } from 'react'
import { Search, X, Bell, Coffee, Utensils, Wheat, GlassWater, Cookie, LayoutGrid } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapView } from '@/components/shared/MapView'
import { BusinessCard } from '@/components/customer/BusinessCard'
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
  { label: 'All',    icon: LayoutGrid  },
  { label: 'Coffee', icon: Coffee      },
  { label: 'Food',   icon: Utensils    },
  { label: 'Bakery', icon: Wheat       },
  { label: 'Drinks', icon: GlassWater  },
  { label: 'Snacks', icon: Cookie      },
]

function matchesCategory(biz: Business, activeCategory: string) {
  if (activeCategory === 'All') return true
  return biz.category?.toLowerCase() === activeCategory.toLowerCase()
}

export function DiscoverClient({ businesses, discountByBiz }: Props) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered = useMemo(() => {
    return businesses.filter(biz => {
      const q = query.toLowerCase()
      const matchesSearch =
        q === '' ||
        biz.name.toLowerCase().includes(q) ||
        biz.category?.toLowerCase().includes(q) ||
        biz.description?.toLowerCase().includes(q)
      return matchesSearch && matchesCategory(biz, activeCategory)
    })
  }, [businesses, query, activeCategory])

  const showResults = query.length > 0

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Full-screen map */}
      <MapView businesses={filtered} discountByBiz={discountByBiz} />

      {/* Floating header overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
        {/* App bar */}
        <div className="flex items-center justify-end px-4 pt-12 pb-2 pointer-events-auto">
          <div className="flex items-center gap-2">
            <PointsBadge className="!bg-white shadow-sm" />
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
            {query ? (
              <button onClick={() => setQuery('')}>
                <X className="h-4 w-4 text-gray-400" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Category chips — hidden while searching */}
        {!showResults && (
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
        )}
      </div>

      {/* Search results panel */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 z-10 px-4 overflow-y-auto pointer-events-auto"
            style={{ top: 160, maxHeight: 'calc(100vh - 180px)' }}
          >
            {filtered.length === 0 ? (
              <p className="text-center text-gray-400 text-sm mt-8">No businesses found</p>
            ) : (
              <div className="space-y-3 pb-6">
                {filtered.map(biz => (
                  <BusinessCard key={biz.id} business={biz} compact />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
