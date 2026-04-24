'use client'

import { CheckCircle2 } from 'lucide-react'
import type { InventoryItem } from '@/types'

interface Props {
  items: InventoryItem[]
  selectedIds: Set<string>
  onToggle: (id: string) => void
  onNext: () => void
}

export function ItemGrid({ items, selectedIds, onToggle, onNext }: Props) {
  const count = selectedIds.size
  const subtotal = items
    .filter(item => selectedIds.has(item.id))
    .reduce((sum, item) => sum + Number(item.price), 0)

  return (
    <div className="pb-32">
      <div className="grid grid-cols-2 gap-3">
        {items.map(item => {
          const selected = selectedIds.has(item.id)
          return (
            <button
              key={item.id}
              onClick={() => onToggle(item.id)}
              className={`relative text-left rounded-xl border-2 p-3 transition-all active:scale-95 ${
                selected ? 'border-primary bg-primary/5' : 'border-gray-100 bg-white'
              }`}
            >
              {selected && (
                <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-primary" />
              )}
              <p className="text-sm font-semibold text-foreground leading-tight pr-5">{item.name}</p>
              <p className="text-xs text-gray-400 mt-0.5 capitalize">{item.category}</p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-sm font-bold text-foreground">${Number(item.price).toFixed(2)}</p>
                <p className="text-xs text-gray-400">Qty {item.quantity}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Sticky selection bar sits above the bottom nav (h-16) */}
      <div className="fixed bottom-16 left-0 right-0 z-30 px-4 pb-2">
        <div className="max-w-lg mx-auto">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-lg flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {count === 0 ? 'No items selected' : `${count} item${count !== 1 ? 's' : ''} selected`}
              </p>
              {count > 0 && (
                <p className="text-xs text-gray-500">Subtotal ${subtotal.toFixed(2)}</p>
              )}
            </div>
            <button
              onClick={onNext}
              disabled={count === 0}
              className="bg-primary text-white text-sm font-semibold px-5 py-2 rounded-xl disabled:opacity-40 transition-opacity"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
