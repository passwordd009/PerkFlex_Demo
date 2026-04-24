'use client'

import { ArrowLeft } from 'lucide-react'
import type { InventoryItem } from '@/types'

const PRESETS = [10, 20, 25, 30, 50, 75, 100]

interface Props {
  items: InventoryItem[]
  percentage: number
  onPercentageChange: (p: number) => void
  onApply: () => void
  onBack: () => void
  isApplying: boolean
}

export function DiscountPreview({
  items,
  percentage,
  onPercentageChange,
  onApply,
  onBack,
  isApplying,
}: Props) {
  const subtotal = items.reduce((sum, item) => sum + Number(item.price), 0)
  const discountAmount = subtotal * (percentage / 100)
  const newTotal = subtotal - discountAmount

  function handleInput(val: string) {
    const n = parseInt(val, 10)
    if (!isNaN(n)) onPercentageChange(Math.min(100, Math.max(10, n)))
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Percentage picker */}
      <div>
        <p className="text-sm font-semibold text-foreground mb-3">Discount Percentage</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {PRESETS.map(p => (
            <button
              key={p}
              onClick={() => onPercentageChange(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                percentage === p
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p}%
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={10}
            max={100}
            value={percentage}
            onChange={e => handleInput(e.target.value)}
            className="w-24 rounded-xl border border-gray-200 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          <span className="text-sm text-gray-500">% (10–100)</span>
        </div>
      </div>

      {/* Per-item preview */}
      <div>
        <p className="text-sm font-semibold text-foreground mb-3">Preview</p>
        <div className="rounded-xl border border-gray-100 overflow-hidden">
          {items.map((item, i) => {
            const original = Number(item.price)
            const discounted = original * (1 - percentage / 100)
            return (
              <div
                key={item.id}
                className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-gray-100' : ''}`}
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{item.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 line-through">${original.toFixed(2)}</p>
                  <p className="text-sm font-semibold text-primary">${discounted.toFixed(2)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Totals summary */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-red-500">
          <span>Discount ({percentage}%)</span>
          <span>-${discountAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-foreground border-t border-gray-200 pt-2">
          <span>New Total</span>
          <span>${newTotal.toFixed(2)}</span>
        </div>
      </div>

      <button
        onClick={onApply}
        disabled={isApplying}
        className="w-full bg-primary text-white font-semibold py-3 rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 transition-opacity"
      >
        {isApplying ? (
          <>
            <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            Applying…
          </>
        ) : (
          'Apply Discount'
        )}
      </button>
    </div>
  )
}
