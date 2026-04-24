'use client'

import { DiscountWizard } from '@/components/business/DiscountWizard'

export default function DiscountsPage() {
  return (
    <div className="px-4 pt-12 pb-6 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-foreground">Create Discount</h1>
        <p className="text-sm text-gray-400 mt-1">
          Select items, add a reason, and apply a percentage discount.
        </p>
      </div>
      <DiscountWizard />
    </div>
  )
}
