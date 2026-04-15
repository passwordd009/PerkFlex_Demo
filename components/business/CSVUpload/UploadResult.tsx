'use client'

import { CheckCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { InventoryUploadResponse } from '@/types'

interface UploadResultProps {
  result: InventoryUploadResponse
  onReset: () => void
}

export function UploadResult({ result, onReset }: UploadResultProps) {
  const { success_count, error_count, errors } = result

  return (
    <div className="space-y-4">
      {success_count > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3">
          <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
          <p className="text-sm font-medium text-green-700">
            {success_count} item{success_count !== 1 ? 's' : ''} uploaded successfully
          </p>
        </div>
      )}

      {error_count > 0 && (
        <div className="rounded-xl bg-amber-50 px-4 py-3 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-sm font-medium text-amber-700">
              {error_count} row{error_count !== 1 ? 's' : ''} failed
            </p>
          </div>
          <ul className="space-y-1 pl-7">
            {errors.map(err => (
              <li key={err.row} className="text-xs text-amber-600">
                Row {err.row}: {err.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {success_count === 0 && error_count === 0 && (
        <p className="text-sm text-gray-500 text-center">No items were processed.</p>
      )}

      <Button type="button" className="w-full" onClick={onReset}>
        Upload Another File
      </Button>
    </div>
  )
}
