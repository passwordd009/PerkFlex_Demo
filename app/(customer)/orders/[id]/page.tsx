'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { ordersApi } from '@/lib/api'
import { QRDisplay } from '@/components/customer/QRDisplay'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatPoints } from '@/lib/utils'
import type { Order } from '@/types'

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.get(id),
    refetchInterval: (query) => {
      const status = query.state.data?.order?.status
      return status === 'pending' || status === 'confirmed' ? 5000 : false
    },
  })

  const order = data?.order

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 pt-12 pb-6">
        <Link href="/orders" className="inline-flex items-center gap-1 text-gray-500 text-sm mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to orders
        </Link>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : order ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* QR code (only for non-completed/cancelled) */}
            {order.status !== 'cancelled' && order.status !== 'completed' && order.qr_token && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <p className="text-center text-sm font-semibold text-gray-600 mb-4">
                  Show this QR code to the business
                </p>
                <QRDisplay order={order as Order} />
              </div>
            )}

            {/* Completed state */}
            {order.status === 'completed' && (
              <div className="bg-green-50 rounded-2xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-green-600 font-bold">
                  <Star className="h-5 w-5 fill-green-500 text-green-500" />
                  Order completed! +{formatPoints(order.points_earned)} points earned
                </div>
              </div>
            )}

            {/* Order summary */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold">Order Summary</h2>
                <Badge
                  variant={order.status === 'completed' ? 'success' : order.status === 'cancelled' ? 'destructive' : 'default'}
                  className="capitalize"
                >
                  {order.status}
                </Badge>
              </div>

              <div className="space-y-2">
                {(order as any).order_items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.quantity}× {item.menu_items?.name}
                    </span>
                    <span>{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between font-bold mt-3 pt-3 border-t border-gray-100">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>

              {order.points_redeemed > 0 && (
                <p className="text-xs text-secondary mt-1 text-right">
                  -{formatPoints(order.points_redeemed)} pts redeemed
                </p>
              )}
            </div>

            {order.notes && (
              <div className="bg-white rounded-2xl p-4 text-sm text-gray-500 shadow-sm border border-gray-100">
                <span className="font-medium text-foreground">Note: </span>{order.notes}
              </div>
            )}
          </motion.div>
        ) : (
          <p className="text-center text-gray-400 text-sm mt-20">Order not found</p>
        )}
      </div>
    </div>
  )
}
