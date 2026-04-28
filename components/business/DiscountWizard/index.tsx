'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { rewardsApi } from '@/lib/api'
import type { CreateRewardRequest } from '@/types'

type Step = 'form' | 'done'

export function DiscountWizard() {
  const [step, setStep] = useState<Step>('form')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [pointsCost, setPointsCost] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsedPoints = parseInt(pointsCost, 10)
    if (!name.trim()) {
      toast.error('Name is required')
      return
    }
    if (!pointsCost || isNaN(parsedPoints) || parsedPoints <= 0) {
      toast.error('Points cost must be a number greater than 0')
      return
    }

    setIsSubmitting(true)
    const payload: CreateRewardRequest = {
      name: name.trim(),
      points_cost: parsedPoints,
      ...(description.trim() && { description: description.trim() }),
    }
    try {
      await rewardsApi.create(payload)
      setStep('done')
    } catch (e: any) {
      toast.error(e.message || 'Failed to create reward')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleReset() {
    setStep('form')
    setName('')
    setDescription('')
    setPointsCost('')
  }

  if (step === 'done') {
    return (
      <div className="flex flex-col items-center text-center py-12 space-y-4">
        <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        </div>
        <div>
          <h2 className="text-xl font-black text-foreground">Reward Created!</h2>
          <p className="text-sm text-gray-500 mt-1">
            &ldquo;{name}&rdquo; is now available to customers.
          </p>
        </div>
        <button
          onClick={handleReset}
          className="mt-4 bg-primary text-white font-semibold px-8 py-3 rounded-xl"
        >
          Create Another
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-foreground mb-1.5">
          Reward Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Free Drink"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-foreground mb-1.5">
          Description <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="e.g. One free drink of your choice"
          rows={3}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-foreground mb-1.5">
          Points Cost <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          value={pointsCost}
          onChange={e => setPointsCost(e.target.value)}
          placeholder="e.g. 500"
          min={1}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="text-xs text-gray-400 mt-1">Customers need this many points to unlock the reward.</p>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
        {isSubmitting ? 'Creating…' : 'Create Reward'}
      </Button>
    </form>
  )
}
