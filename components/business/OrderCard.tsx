'use client'

import { Clock, CheckCircle, Package, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import type { Order, OrderStatus } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

const statusConfig: Record<OrderStatus, { label: string; color: 'default' | 'support' | 'success' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  pending:   { label: 'Pending',   color: 'outline',      icon: Clock },
  confirmed: { label: 'Confirmed', color: 'default',      icon: Package },
  ready:     { label: 'Ready',     color: 'support',      icon: Package },
  completed: { label: 'Completed', color: 'success',      icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'destructive',  icon: XCircle },
}

interface OrderCardProps {
  order: Order
}

export function OrderCard({ order }: OrderCardProps) {
  const queryClient = useQueryClient()
  const config = statusConfig[order.status]
  const StatusIcon = config.icon

  const { mutate: updateStatus } = useMutation({
    mutationFn: async (status: OrderStatus) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', order.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-orders'] })
      toast.success('Order status updated')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-bold text-sm">Order #{order.id.slice(0, 8).toUpperCase()}</p>
              <p className="text-xs text-gray-400">
                {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
            <Badge variant={config.color} className="flex items-center gap-1">
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </Badge>
          </div>

          {order.items?.map(item => (
            <div key={item.id} className="flex justify-between text-sm py-0.5">
              <span className="text-gray-600">
                {item.quantity}× {(item as any).item_name}
              </span>
              <span>{formatCurrency(item.subtotal)}</span>
            </div>
          ))}

          <div className="flex justify-between font-bold mt-2 pt-2 border-t border-gray-100">
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>

          {order.notes && (
            <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg p-2">
              Note: {order.notes}
            </p>
          )}

          {/* Status actions */}
          {order.status === 'pending' && (
            <div className="flex gap-2 mt-3">
              <Button size="sm" className="flex-1" onClick={() => updateStatus('confirmed')}>
                Confirm
              </Button>
              <Button size="sm" variant="destructive" className="flex-1" onClick={() => updateStatus('cancelled')}>
                Cancel
              </Button>
            </div>
          )}
          {order.status === 'confirmed' && (
            <Button size="sm" className="w-full mt-3" onClick={() => updateStatus('ready')}>
              Mark Ready for Pickup
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
