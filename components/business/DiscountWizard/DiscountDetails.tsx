'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { ImageUpload } from '@/components/ImageUpload'

export interface DetailsData {
  title: string
  description: string
  image_url: string
}

interface Props {
  initial: DetailsData
  onNext: (data: DetailsData) => void
  onBack: () => void
}

export function DiscountDetails({ initial, onNext, onBack }: Props) {
  const [title, setTitle]             = useState(initial.title)
  const [description, setDescription] = useState(initial.description)
  const [imageUrl, setImageUrl]       = useState<string | null>(initial.image_url || null)

  const inputClass =
    'w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary'

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Customer Loyalty Discount"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">
            Photo{' '}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <ImageUpload
            value={imageUrl}
            bucket="ember"
            path={`discounts/draft-${Date.now()}`}
            onUpload={url => setImageUrl(url)}
            onClear={() => setImageUrl(null)}
            placeholder="Upload discount image"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">
            Description{' '}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. End of day promo · Customer loyalty reward"
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      <button
        onClick={() => onNext({ title: title.trim(), description: description.trim(), image_url: imageUrl ?? '' })}
        disabled={title.trim().length === 0}
        className="w-full bg-primary text-white font-semibold py-3 rounded-xl disabled:opacity-40 transition-opacity"
      >
        Next
      </button>
    </div>
  )
}
