'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Trash2, Star } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { useCartStore } from '@/lib/store'
import { ordersApi } from '@/lib/api'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface CartSheetProps {
  businessId: string
}

export function CartSheet({ businessId }: CartSheetProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const { items, removeItem, total, clearCart } = useCartStore()
  const cartTotal = total()
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  const { data: pointsBalance = 0 } = useQuery<number>({
    queryKey: ['my-points'],
    enabled: isOpen,
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return 0
      const { data } = await supabase
        .from('profiles')
        .select('points_balance')
        .eq('id', user.id)
        .single()
      return data?.points_balance ?? 0
    },
  })

  const { mutate: placeOrder, isPending } = useMutation({
    mutationFn: () =>
      ordersApi.create({
        businessId,
        items: items.map(i => ({ inventoryItemId: i.item.id, quantity: i.quantity })),
      }),
    onSuccess: (data) => {
      clearCart()
      setIsOpen(false)
      router.push(`/orders/${data.orderId}`)
      toast.success('Order placed! Show your QR code to the business.')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (itemCount === 0) return null

  return (
    <>
      <motion.button
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 bg-primary text-white rounded-full px-6 py-3 shadow-xl flex items-center gap-3 font-semibold"
      >
        <ShoppingCart className="h-5 w-5" />
        <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
        <Badge variant="accent" className="bg-white/20 text-white border-0">
          {formatCurrency(cartTotal)}
        </Badge>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl px-4 pb-8 pt-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

              {/* Header with points balance */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Your Cart</h2>
                <span className="flex items-center gap-1 text-sm font-semibold text-amber-600">
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                  {pointsBalance} pts
                </span>
              </div>

              {/* Cart items */}
              <div className="space-y-3 mb-4">
                {items.map(({ item, quantity }) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(item.price)} × {quantity}</p>
                    </div>
                    <span className="font-bold text-sm">{formatCurrency(item.price * quantity)}</span>
                    <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-gray-100 pt-3 mb-4 space-y-1">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(cartTotal)}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-1">
                  <span>Total</span>
                  <span>{formatCurrency(cartTotal)}</span>
                </div>
                <p className="text-xs text-gray-400">Pay in person when you pick up</p>
              </div>

              <Button className="w-full" size="lg" onClick={() => placeOrder()} disabled={isPending}>
                {isPending ? 'Placing Order…' : 'Place Order & Get QR Code'}
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
