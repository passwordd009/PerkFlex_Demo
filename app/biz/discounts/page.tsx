'use client'

import { DiscountWizard } from '@/components/business/DiscountWizard'

export default function DiscountsPage() {
  return (
    <div className="px-4 pt-12 pb-6 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-foreground">Create Reward</h1>
        <p className="text-sm text-gray-400 mt-1">
          Create a standalone reward that customers can unlock with their points.
        </p>
      </div>
      <DiscountWizard />
    </div>
  )
}
