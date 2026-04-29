'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ImageUpload } from '@/components/ImageUpload'
import { toast } from 'sonner'

interface Props {
  businessId: string
  onDone: () => void
}

interface FormValues {
  name: string
  price: number
  quantity: number
  category: string
}

export function InventoryCreateForm({ businessId, onDone }: Props) {
  const [isPending, setIsPending] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: { name: '', price: 0, quantity: 0, category: '' },
  })

  async function onSubmit(values: FormValues) {
    setIsPending(true)
    try {
      const supabase = createClient()

      // Check for exact duplicate (same name + same price)
      const { data: existing } = await supabase
        .from('inventory')
        .select('id')
        .eq('business_id', businessId)
        .ilike('name', values.name.trim())
        .eq('price', values.price)
        .maybeSingle()

      if (existing) {
        toast.error('An item with this name and price already exists')
        return
      }

      const { error } = await supabase.from('inventory').insert({
        name: values.name.trim(),
        price: values.price,
        quantity: values.quantity,
        category: values.category.trim() || 'Uncategorized',
        business_id: businessId,
        image_url: imageUrl,
      })
      if (error) throw error
      toast.success('Item added')
      onDone()
    } catch (e: any) {
      toast.error(e.message)
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
          path={`inventory/new-${Date.now()}`}
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

      <div className="grid grid-cols-2 gap-2">
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

        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Quantity *</label>
          <Input
            type="number"
            min="0"
            step="1"
            {...register('quantity', { required: true, valueAsNumber: true, min: 0 })}
            placeholder="0"
          />
          {errors.quantity && <p className="text-xs text-red-500 mt-1">Required</p>}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Category *</label>
        <Input
          {...register('category', { required: 'Category is required' })}
          placeholder="e.g. Food, Drinks, Desserts"
        />
        {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>}
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={onDone}>Cancel</Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? 'Adding…' : 'Add Item'}
        </Button>
      </div>
    </form>
  )
}
