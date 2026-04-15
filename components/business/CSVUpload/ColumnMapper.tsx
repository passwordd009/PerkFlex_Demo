'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { ColumnMapping, RequiredField } from '@/types'

const REQUIRED_FIELDS: { field: RequiredField; label: string }[] = [
  { field: 'name', label: 'Name' },
  { field: 'price', label: 'Price' },
  { field: 'quantity', label: 'Quantity' },
  { field: 'category', label: 'Category' },
]

// Lowercase aliases → required field
const FIELD_ALIASES: Record<string, RequiredField> = {
  name: 'name',
  'item name': 'name',
  'item': 'name',
  product: 'name',
  'product name': 'name',
  price: 'price',
  cost: 'price',
  amount: 'price',
  'unit price': 'price',
  qty: 'quantity',
  quantity: 'quantity',
  stock: 'quantity',
  count: 'quantity',
  category: 'category',
  type: 'category',
  kind: 'category',
  'item type': 'category',
}

function autoMatch(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = { name: null, price: null, quantity: null, category: null }
  for (const header of headers) {
    const matched = FIELD_ALIASES[header.toLowerCase().trim()]
    if (matched && mapping[matched] === null) {
      mapping[matched] = header
    }
  }
  return mapping
}

interface ColumnMapperProps {
  headers: string[]
  onConfirm: (mapping: ColumnMapping) => void
  onBack: () => void
}

export function ColumnMapper({ headers, onConfirm, onBack }: ColumnMapperProps) {
  const [mapping, setMapping] = useState<ColumnMapping>(() => autoMatch(headers))

  useEffect(() => {
    setMapping(autoMatch(headers))
  }, [headers])

  const allMapped = REQUIRED_FIELDS.every(({ field }) => mapping[field] !== null)

  function handleSelect(field: RequiredField, value: string) {
    setMapping(prev => ({ ...prev, [field]: value || null }))
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Map your CSV columns to the required fields. Auto-matched columns are pre-selected.
      </p>

      <div className="space-y-3">
        {REQUIRED_FIELDS.map(({ field, label }) => (
          <div key={field} className="grid grid-cols-2 items-center gap-3">
            <label className="text-sm font-medium text-foreground">
              {label} <span className="text-red-500">*</span>
            </label>
            <select
              value={mapping[field] ?? ''}
              onChange={e => handleSelect(field, e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Select column…</option>
              {headers.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {!allMapped && (
        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
          All fields must be mapped before continuing.
        </p>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={onBack}>
          Back
        </Button>
        <Button
          type="button"
          className="flex-1"
          disabled={!allMapped}
          onClick={() => allMapped && onConfirm(mapping)}
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
