'use client'

import { Plus, Minus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { useCartStore } from '@/lib/store'
import type { InventoryItem, Business } from '@/types'

interface MenuCardProps {
  item: InventoryItem
  business: Business
}

export function MenuCard({ item, business }: MenuCardProps) {
  const { items, addItem, updateQuantity } = useCartStore()

  const cartItem = items.find(i => i.item.id === item.id)
  const qty = cartItem?.quantity ?? 0
  const isAvailable = item.quantity > 0

  const handleAdd = () => addItem(item, business.id, business.district_id)
  const handleDecrement = () => updateQuantity(item.id, qty - 1)

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex gap-3 p-3">
          {item.image_url && (
            <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm leading-tight">{item.name}</p>

            <div className="flex items-center justify-between mt-2">
              <span className="font-bold text-foreground">{formatCurrency(item.price)}</span>

              <AnimatePresence mode="wait">
                {qty === 0 ? (
                  <motion.div key="add" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                    <Button size="icon" className="h-8 w-8 rounded-full" onClick={handleAdd} disabled={!isAvailable}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div key="counter" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex items-center gap-2">
                    <button onClick={handleDecrement} className="w-8 h-8 rounded-full border-2 border-primary text-primary flex items-center justify-center">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="font-bold text-foreground w-4 text-center">{qty}</span>
                    <button onClick={handleAdd} className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                      <Plus className="h-3 w-3" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
