'use client'

import { useState } from 'react'
import { z } from 'zod'
import { toast } from 'sonner'
import { inventoryApi } from '@/lib/api'
import { FileDropzone } from './FileDropzone'
import { DataPreview } from './DataPreview'
import { ColumnMapper } from './ColumnMapper'
import { UploadResult } from './UploadResult'
import type { ColumnMapping, InventoryUploadItem, InventoryUploadResponse } from '@/types'

type Step = 'idle' | 'preview' | 'uploading' | 'done'

const InventoryItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.number().nonnegative('Price must be 0 or greater'),
  quantity: z.number().int('Quantity must be a whole number').nonnegative('Quantity must be 0 or greater'),
  category: z.string().min(1, 'Category is required'),
})

function transformRows(
  rows: Record<string, string>[],
  mapping: ColumnMapping
): { valid: InventoryUploadItem[]; errors: Array<{ row: number; message: string }> } {
  const valid: InventoryUploadItem[] = []
  const errors: Array<{ row: number; message: string }> = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const raw = {
      name: String(row[mapping.name!] ?? '').trim(),
      price: parseFloat(String(row[mapping.price!] ?? '')),
      quantity: parseInt(String(row[mapping.quantity!] ?? ''), 10),
      category: String(row[mapping.category!] ?? '').trim() || 'Uncategorized',
    }
    const result = InventoryItemSchema.safeParse(raw)
    if (result.success) {
      valid.push(result.data)
    } else {
      errors.push({
        row: i + 1,
        message: result.error.issues.map((e: { message: string }) => e.message).join('; '),
      })
    }
  }
  return { valid, errors }
}

export function CSVUpload({ onDone }: { onDone?: () => void } = {}) {
  const [step, setStep] = useState<Step>('idle')
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<ColumnMapping>({ name: null, price: null, quantity: null, category: null })
  const [result, setResult] = useState<InventoryUploadResponse | null>(null)

  function handleParsed(parsedRows: Record<string, string>[], parsedHeaders: string[]) {
    setRows(parsedRows)
    setHeaders(parsedHeaders)
    setStep('preview')
  }

  async function handleConfirm(confirmedMapping: ColumnMapping) {
    setMapping(confirmedMapping)
    setStep('uploading')

    const { valid, errors: frontendErrors } = transformRows(rows, confirmedMapping)

    // Deduplicate within the CSV itself by name+price before sending
    const seenKeys = new Set<string>()
    const dedupedValid = valid.filter(item => {
      const key = `${item.name.toLowerCase().trim()}:${item.price}`
      if (seenKeys.has(key)) return false
      seenKeys.add(key)
      return true
    })
    const inFileDuplicates = valid.length - dedupedValid.length

    if (dedupedValid.length === 0) {
      setResult({ success_count: 0, error_count: frontendErrors.length, duplicate_count: inFileDuplicates, errors: frontendErrors })
      setStep('done')
      return
    }

    try {
      const response = await inventoryApi.upload(dedupedValid)
      // Merge frontend errors/duplicates with backend response
      setResult({
        success_count: response.success_count,
        error_count: frontendErrors.length + response.error_count,
        duplicate_count: (response.duplicate_count ?? 0) + inFileDuplicates,
        errors: [...frontendErrors, ...response.errors],
      })
      setStep('done')
      onDone?.()
    } catch (e: any) {
      toast.error(e.message || 'Upload failed')
      setStep('preview')
    }
  }

  function handleReset() {
    setStep('idle')
    setRows([])
    setHeaders([])
    setMapping({ name: null, price: null, quantity: null, category: null })
    setResult(null)
  }

  return (
    <div className="space-y-6">
      {step === 'idle' && (
        <FileDropzone onParsed={handleParsed} />
      )}

      {(step === 'preview' || step === 'uploading') && (
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">Preview</h2>
            <DataPreview headers={headers} rows={rows} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">Map Columns</h2>
            <ColumnMapper
              headers={headers}
              onConfirm={handleConfirm}
              onBack={handleReset}
            />
          </div>

          {step === 'uploading' && (
            <div className="flex items-center justify-center py-4">
              <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span className="ml-2 text-sm text-gray-500">Uploading…</span>
            </div>
          )}
        </div>
      )}

      {step === 'done' && result && (
        <UploadResult result={result} onReset={handleReset} />
      )}
    </div>
  )
}
