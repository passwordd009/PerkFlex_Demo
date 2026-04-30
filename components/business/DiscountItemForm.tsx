'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ImageUpload } from '@/components/ImageUpload'
import { toast } from 'sonner'
import type { Discount } from '@/types'

interface Props {
  discount: Discount
  onDone: () => void
}

interface FormValues {
  title: string
  discount_percentage: number
}

export function DiscountItemForm({ discount, onDone }: Props) {
  const [isPending, setIsPending] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(discount.image_url ?? null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      title: discount.title,
      discount_percentage: discount.discount_percentage,
    },
  })

  async function onSubmit(values: FormValues) {
    setIsPending(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('discounts')
        .update({
          title: values.title.trim(),
          image_url: imageUrl,
          discount_percentage: values.discount_percentage,
        })
        .eq('id', discount.id)
      if (error) throw new Error(error.message)
      toast.success('Discount updated')
      onDone()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update discount')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Photo</label>
        <ImageUpload
          value={imageUrl}
          bucket="ember"
          path={`discounts/${discount.id}`}
          onUpload={setImageUrl}
          onClear={() => setImageUrl(null)}
          placeholder="Upload discount image"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Name *</label>
        <Input
          {...register('title', { required: 'Name is required' })}
          placeholder="e.g. Customer Loyalty Discount"
        />
        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Discount % *</label>
        <Input
          type="number"
          min="10"
          max="100"
          {...register('discount_percentage', {
            required: true,
            valueAsNumber: true,
            min: { value: 10, message: 'Minimum 10%' },
            max: { value: 100, message: 'Maximum 100%' },
          })}
          placeholder="20"
        />
        {errors.discount_percentage && (
          <p className="text-xs text-red-500 mt-1">{errors.discount_percentage.message}</p>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? 'Saving…' : 'Update Discount'}
        </Button>
      </div>
    </form>
  )
}
