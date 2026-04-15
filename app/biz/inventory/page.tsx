'use client'

import { CSVUpload } from '@/components/business/CSVUpload'

export default function InventoryPage() {
  return (
    <div className="px-4 pt-12 pb-6 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-foreground">Inventory Upload</h1>
        <p className="text-sm text-gray-400 mt-1">
          Upload a CSV file to bulk-add inventory items. Any column names work — just map them below.
        </p>
      </div>

      <CSVUpload />
    </div>
  )
}
