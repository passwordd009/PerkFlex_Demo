'use client'

import { CheckCircle2 } from 'lucide-react'

interface Props {
  title: string
  itemCount: number
  percentage: number
  onReset: () => void
}

export function DiscountSuccess({ title, itemCount, percentage, onReset }: Props) {
  return (
    <div className="flex flex-col items-center text-center py-12 space-y-4">
      <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center">
        <CheckCircle2 className="h-8 w-8 text-green-500" />
      </div>
      <div>
        <h2 className="text-xl font-black text-foreground">Discount Applied</h2>
        <p className="text-sm text-gray-500 mt-1">"{title}" was saved</p>
      </div>
      <div className="bg-gray-50 rounded-xl px-5 py-3 text-sm text-gray-600">
        <span className="font-semibold text-primary">{percentage}% off</span> on{' '}
        {itemCount} item{itemCount !== 1 ? 's' : ''}
      </div>
      <button
        onClick={onReset}
        className="mt-4 bg-primary text-white font-semibold px-8 py-3 rounded-xl"
      >
        Create Another
      </button>
    </div>
  )
}
