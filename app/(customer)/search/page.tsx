'use client'

import { useState, useMemo, useCallback, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { SearchBar } from '@/components/shared/SearchBar'
import { BusinessCard } from '@/components/customer/BusinessCard'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { Business } from '@/types'

const CATEGORIES = ['All', 'Coffee', 'Food', 'Bakery', 'Drinks', 'Snacks']

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [, startTransition] = useTransition()

  const { data: businesses, isLoading } = useQuery({
    queryKey: ['businesses'],
    queryFn: async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('businesses')
        .select('*, districts(id, name)')
        .eq('is_active', true)
      return (data ?? []) as Business[]
    },
  })

  const filtered = useMemo(() => {
    if (!businesses) return []
    return businesses.filter(b => {
      const matchesQuery =
        !query ||
        b.name.toLowerCase().includes(query.toLowerCase()) ||
        b.description?.toLowerCase().includes(query.toLowerCase())
      const matchesCategory =
        activeCategory === 'All' || b.category?.toLowerCase() === activeCategory.toLowerCase()
      return matchesQuery && matchesCategory
    })
  }, [businesses, query, activeCategory])

  const handleSearch = useCallback((q: string) => {
    startTransition(() => setQuery(q))
  }, [])

  return (
    <div className="px-4 pt-12 pb-6">
      <h1 className="text-2xl font-black text-foreground mb-4">Search</h1>

      <SearchBar onSearch={handleSearch} className="mb-4" />

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}>
            <Badge
              variant={activeCategory === cat ? 'default' : 'outline'}
              className="cursor-pointer whitespace-nowrap px-3 py-1 text-xs"
            >
              {cat}
            </Badge>
          </button>
        ))}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-gray-400 text-sm mt-12"
            >
              No businesses found
            </motion.p>
          ) : (
            <motion.div className="space-y-3">
              {filtered.map((biz, i) => (
                <motion.div
                  key={biz.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <BusinessCard business={biz} compact />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
