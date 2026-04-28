'use client'

import { Plus, Minus, Package } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Image */}
      {item.image_url ? (
        <img src={item.image_url} alt={item.name} className="w-full h-28 object-cover" />
      ) : (
        <div className="w-full h-28 bg-gray-50 flex items-center justify-center">
          <Package className="h-8 w-8 text-gray-200" />
        </div>
      )}

      <div className="p-3">
        <p className="text-sm font-semibold text-foreground leading-tight">{item.name}</p>

        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-bold text-foreground">
            {isAvailable ? formatCurrency(item.price) : <span className="text-xs text-gray-400">Sold out</span>}
          </span>

          <AnimatePresence mode="wait">
            {qty === 0 ? (
              <motion.button
                key="add"
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                onClick={handleAdd}
                disabled={!isAvailable}
                className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </motion.button>
            ) : (
              <motion.div
                key="counter"
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5"
              >
                <button onClick={handleDecrement} className="w-7 h-7 rounded-full border-2 border-primary text-primary flex items-center justify-center">
                  <Minus className="h-3 w-3" />
                </button>
                <span className="font-bold text-foreground w-4 text-center text-sm">{qty}</span>
                <button onClick={handleAdd} className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center">
                  <Plus className="h-3 w-3" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
