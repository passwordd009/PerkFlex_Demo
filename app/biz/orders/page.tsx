'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { OrderCard } from '@/components/business/OrderCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import type { Order, OrderStatus } from '@/types'

const FILTERS: { label: string; statuses: OrderStatus[] }[] = [
  { label: 'Active', statuses: ['pending', 'confirmed', 'ready'] },
  { label: 'Completed', statuses: ['completed'] },
  { label: 'All', statuses: ['pending', 'confirmed', 'ready', 'completed', 'cancelled'] },
]

export default function BusinessOrdersPage() {
  const [filterIdx, setFilterIdx] = useState(0)

  const { data: orders, isLoading } = useQuery({
    queryKey: ['business-orders'],
    queryFn: async () => {
      const supabase = createClient()
      // Get the owner's business first
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      if (!business) return []

      const { data } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false })
        .limit(50)

      return (data ?? []) as Order[]
    },
    refetchInterval: 10_000,
  })

  const filtered = orders?.filter(o => FILTERS[filterIdx].statuses.includes(o.status)) ?? []

  return (
    <div className="px-4 pt-12 pb-6">
      <h1 className="text-2xl font-black text-foreground mb-4">Orders</h1>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {FILTERS.map((f, i) => (
          <button key={f.label} onClick={() => setFilterIdx(i)}>
            <Badge
              variant={filterIdx === i ? 'default' : 'outline'}
              className="cursor-pointer px-3 py-1"
            >
              {f.label}
            </Badge>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <Skeleton key={i} className="h-36 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-16">No orders</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}
