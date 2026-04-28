'use client'

import { ArrowLeft, Star } from 'lucide-react'
import type { InventoryItem } from '@/types'

const PRESETS = [5, 10, 15, 20, 25, 30, 50]
const PPV = 0.01 // $0.01 per point — mirror of server constant

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
  const avgPrice = items.length > 0
    ? items.reduce((sum, i) => sum + Number(i.price), 0) / items.length
    : 0

  // PR = TIV × p / PPV
  const pointsCost = Math.max(1, Math.round((avgPrice * (percentage / 100)) / PPV))
  const pointsValue = pointsCost * PPV // $ value customer spends in points

  function handleInput(val: string) {
    const n = parseInt(val, 10)
    if (!isNaN(n)) onPercentageChange(Math.min(100, Math.max(1, n)))
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
            min={1}
            max={100}
            value={percentage}
            onChange={e => handleInput(e.target.value)}
            className="w-24 rounded-xl border border-gray-200 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          <span className="text-sm text-gray-500">%  (1–100)</span>
        </div>
      </div>

      {/* Points cost formula breakdown */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
          <p className="text-sm font-bold text-amber-800">Points to unlock</p>
        </div>
        <div className="text-xs text-amber-700 space-y-0.5">
          <p>TIV  =  ${avgPrice.toFixed(2)}  (avg item value)</p>
          <p>p    =  {percentage}%  (discount rate)</p>
          <p>PPV  =  ${PPV.toFixed(2)}  (1 point = {PPV * 100}¢)</p>
          <p className="border-t border-amber-200 pt-1 font-semibold">
            PR = ${avgPrice.toFixed(2)} × {percentage / 100} ÷ ${PPV.toFixed(2)} = <span className="text-amber-900">{pointsCost} pts</span>
          </p>
        </div>
        <p className="text-xs text-amber-600 mt-1">
          You give up ${(avgPrice * percentage / 100).toFixed(2)} per item · customer spends ${pointsValue.toFixed(2)} in points
        </p>
      </div>

      {/* Per-item preview */}
      <div>
        <p className="text-sm font-semibold text-foreground mb-3">Item Preview</p>
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
          `Apply Discount (${pointsCost} pts to unlock)`
        )}
      </button>
    </div>
  )
}
