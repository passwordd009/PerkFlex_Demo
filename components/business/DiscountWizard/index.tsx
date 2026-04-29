'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { inventoryApi, discountsApi } from '@/lib/api'
import { ItemGrid } from './ItemGrid'
import { DiscountDetails } from './DiscountDetails'
import { DiscountPreview } from './DiscountPreview'
import { DiscountSuccess } from './DiscountSuccess'
import type { InventoryItem, CreateDiscountRequest } from '@/types'

type Step = 'select' | 'details' | 'preview' | 'done'

interface DetailsData {
  title: string
  description: string
  image_url: string
}

export function DiscountWizard() {
  const [step, setStep] = useState<Step>('select')
  const [items, setItems] = useState<InventoryItem[]>([])
  const [isLoadingItems, setIsLoadingItems] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [details, setDetails] = useState<DetailsData>({ title: '', description: '', image_url: '' })
  const [percentage, setPercentage] = useState(20)
  const [isApplying, setIsApplying] = useState(false)

  useEffect(() => {
    inventoryApi
      .list()
      .then(setItems)
      .catch(() => toast.error('Failed to load inventory'))
      .finally(() => setIsLoadingItems(false))
  }, [])

  const selectedItems = items.filter(item => selectedIds.has(item.id))

  function toggleItem(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleApply() {
    setIsApplying(true)
    const payload: CreateDiscountRequest = {
      title: details.title,
      discount_percentage: percentage,
      item_ids: Array.from(selectedIds),
      ...(details.description && { description: details.description }),
      ...(details.image_url && { image_url: details.image_url }),
    }
    try {
      await discountsApi.create(payload)
      setStep('done')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create discount')
    } finally {
      setIsApplying(false)
    }
  }

  function handleReset() {
    setStep('select')
    setSelectedIds(new Set())
    setDetails({ title: '', description: '', image_url: '' })
    setPercentage(20)
  }

  if (isLoadingItems) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-sm">No inventory items found.</p>
        <p className="text-xs mt-1">Upload inventory first to create discounts.</p>
      </div>
    )
  }

  return (
    <>
      {step === 'select' && (
        <ItemGrid
          items={items}
          selectedIds={selectedIds}
          onToggle={toggleItem}
          onNext={() => setStep('details')}
        />
      )}
      {step === 'details' && (
        <DiscountDetails
          initial={details}
          onNext={d => { setDetails(d); setStep('preview') }}
          onBack={() => setStep('select')}
        />
      )}
      {step === 'preview' && (
        <DiscountPreview
          items={selectedItems}
          percentage={percentage}
          onPercentageChange={setPercentage}
          onApply={handleApply}
          onBack={() => setStep('details')}
          isApplying={isApplying}
        />
      )}
      {step === 'done' && (
        <DiscountSuccess
          title={details.title}
          itemCount={selectedIds.size}
          percentage={percentage}
          onReset={handleReset}
        />
      )}
    </>
  )
}
