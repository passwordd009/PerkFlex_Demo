'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ImageUpload } from '@/components/ImageUpload'
import { toast } from 'sonner'
import type { InventoryItem } from '@/types'

interface Props {
  item: InventoryItem
  onDone: () => void
}

interface FormValues {
  name: string
  price: number
}

export function InventoryItemForm({ item, onDone }: Props) {
  const [isPending, setIsPending] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(item.image_url)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      name: item.name,
      price: Number(item.price),
    },
  })

  async function onSubmit(values: FormValues) {
    setIsPending(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('inventory')
        .update({
          name: values.name.trim(),
          image_url: imageUrl,
          price: values.price,
        })
        .eq('id', item.id)
      if (error) throw new Error(error.message)
      toast.success('Item updated')
      onDone()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update item')
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
          path={`inventory/${item.id}`}
          onUpload={setImageUrl}
          onClear={() => setImageUrl(null)}
          placeholder="Upload item photo"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Name *</label>
        <Input
          {...register('name', { required: 'Name is required' })}
          placeholder="Item name"
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Price *</label>
        <Input
          type="number"
          step="0.01"
          min="0"
          {...register('price', { required: true, valueAsNumber: true, min: 0 })}
          placeholder="0.00"
        />
        {errors.price && <p className="text-xs text-red-500 mt-1">Valid price required</p>}
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={onDone}>Cancel</Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? 'Saving…' : 'Update Item'}
        </Button>
      </div>
    </form>
  )
}
