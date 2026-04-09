'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import { MenuCard } from '@/components/customer/MenuCard'
import { CartSheet } from '@/components/customer/CartSheet'
import { Badge } from '@/components/ui/badge'
import type { Business, MenuItem } from '@/types'

interface Props {
  business: Business
  menuItems: MenuItem[]
}

export function BusinessMenuClient({ business, menuItems }: Props) {
  const grouped = useMemo(() => {
    const map = new Map<string, MenuItem[]>()
    for (const item of menuItems) {
      const cat = item.category ?? 'Other'
      map.set(cat, [...(map.get(cat) ?? []), item])
    }
    return map
  }, [menuItems])

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

        {/* Menu */}
        {grouped.size === 0 ? (
          <p className="text-center text-gray-400 text-sm py-12">No menu items available</p>
        ) : (
          <div className="space-y-6 pb-6">
            {[...grouped.entries()].map(([category, items]) => (
              <section key={category}>
                <h2 className="font-bold text-foreground mb-3">{category}</h2>
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <MenuCard item={item} business={business} />
                    </motion.div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <CartSheet businessId={business.id} />
    </div>
  )
}
