'use client'

import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { ordersApi } from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { ChevronRight, ShoppingBag } from 'lucide-react'
import type { Order } from '@/types'

const statusColors: Record<string, 'default' | 'support' | 'success' | 'destructive' | 'outline'> = {
  pending:   'outline',
  confirmed: 'default',
  ready:     'support',
  completed: 'success',
  cancelled: 'destructive',
}

export default function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersApi.list(),
  })

  return (
    <div className="px-4 pt-12 pb-6">
      <h1 className="text-2xl font-black text-foreground mb-6">My Orders</h1>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : !data?.orders?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <ShoppingBag className="h-12 w-12 mb-3 opacity-40" />
          <p className="text-sm">No orders yet</p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {data.orders.map((order: Order, i: number) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link href={`/orders/${order.id}`}>
                  <div className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-3 shadow-sm active:scale-[0.98] transition-transform">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold text-xs">
                        {(order as any).businesses?.name?.charAt(0) ?? '#'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">
                        {(order as any).businesses?.name ?? 'Order'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(order.created_at).toLocaleDateString()} · {formatCurrency(order.total)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusColors[order.status] ?? 'outline'} className="text-[10px]">
                        {order.status}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-gray-300" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  )
}
