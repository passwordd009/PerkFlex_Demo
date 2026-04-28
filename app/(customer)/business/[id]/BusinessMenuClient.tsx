'use client'

import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import { MenuCard } from '@/components/customer/MenuCard'
import { RewardCard } from '@/components/customer/RewardCard'
import { CartSheet } from '@/components/customer/CartSheet'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import type { Business, InventoryItem, Reward } from '@/types'

interface Props {
  business: Business
  inventoryItems: InventoryItem[]
  rewards: Reward[]
}

export function BusinessMenuClient({ business, inventoryItems, rewards }: Props) {
  const categories = useMemo(() => {
    const cats = Array.from(new Set(inventoryItems.map(i => i.category ?? 'Other')))
    return cats
  }, [inventoryItems])

  const allTabs = useMemo(() => ['Rewards', ...categories], [categories])
  const [selectedTab, setSelectedTab] = useState<string>(categories[0] ?? 'Rewards')

  const [pointsBalance, setPointsBalance] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('profiles')
        .select('points_balance')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setPointsBalance(data.points_balance)
        })
    })
  }, [])

  const groupedByCategory = useMemo(() => {
    const map = new Map<string, InventoryItem[]>()
    for (const item of inventoryItems) {
      const cat = item.category ?? 'Other'
      map.set(cat, [...(map.get(cat) ?? []), item])
    }
    return map
  }, [inventoryItems])

  const currentItems = groupedByCategory.get(selectedTab) ?? []

  return (
    <div>
      {/* Cover + header */}
      <div className="relative">
        <div
          className="h-48 bg-gradient-to-br from-primary to-secondary"
          style={business.cover_url ? { backgroundImage: `url(${business.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        />
        <Link
          href="/search"
          className="absolute top-12 left-4 bg-white/90 backdrop-blur rounded-full p-2 shadow-sm"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </Link>
      </div>

      <div className="px-4 -mt-6 relative z-10">
        {/* Business info card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
              {business.logo_url ? (
                <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary font-black text-xl">{business.name.charAt(0)}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-black text-lg text-foreground leading-tight">{business.name}</h1>
              {business.category && (
                <Badge variant="default" className="text-[10px] mt-0.5">{business.category}</Badge>
              )}
              {business.address && (
                <div className="flex items-center gap-1 mt-1 text-gray-400 text-xs">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{business.address}</span>
                </div>
              )}
            </div>
          </div>
          {business.description && (
            <p className="text-sm text-gray-500 mt-2">{business.description}</p>
          )}
        </div>

        {/* Category tab bar */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {allTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                selectedTab === tab
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {selectedTab === 'Rewards' ? (
          rewards.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-12">No rewards available</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 pb-6">
              {rewards.map((reward, i) => (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <RewardCard reward={reward} pointsBalance={pointsBalance} />
                </motion.div>
              ))}
            </div>
          )
        ) : (
          currentItems.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-12">No items available</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 pb-6">
              {currentItems.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <MenuCard item={item} business={business} />
                </motion.div>
              ))}
            </div>
          )
        )}
      </div>

      <CartSheet businessId={business.id} />
    </div>
  )
}
