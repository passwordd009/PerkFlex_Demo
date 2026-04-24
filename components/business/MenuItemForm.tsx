'use client'

import { useForm } from 'react-hook-form'
import { createClient } from '@/lib/supabase/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import type { MenuItem } from '@/types'

interface MenuItemFormProps {
  businessId: string
  item?: MenuItem
  onDone: () => void
}

interface FormValues {
  name: string
  description: string
  price: number
  category: string
  image_url: string
  points_value: number
}

export function MenuItemForm({ businessId, item, onDone }: MenuItemFormProps) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: item
      ? {
          name: item.name,
          description: item.description ?? '',
          price: item.price,
          category: item.category ?? '',
          image_url: item.image_url ?? '',
          points_value: item.points_value,
        }
      : { points_value: 0, image_url: '' },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      const supabase = createClient()
      const data = {
        name: values.name.trim(),
        description: values.description.trim() || null,
        price: values.price,
        category: values.category.trim() || null,
        image_url: values.image_url.trim() || null,
        points_value: values.points_value,
        business_id: businessId,
      }

      if (item) {
        const { error } = await supabase.from('menu_items').update(data).eq('id', item.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('menu_items').insert(data)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-menu'] })
      toast.success(item ? 'Item updated' : 'Item added to menu')
      onDone()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <form onSubmit={handleSubmit(v => mutate(v))} className="space-y-3">
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Name *</label>
        <Input
          {...register('name', { required: 'Name is required' })}
          placeholder="e.g. Iced Latte"
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Description</label>
        <Input {...register('description')} placeholder="Short description…" />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Photo URL</label>
        <Input {...register('image_url')} type="url" placeholder="https://…" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Price *</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            {...register('price', { required: true, valueAsNumber: true, min: 0 })}
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Bonus Points</label>
          <Input
            type="number"
            min="0"
            {...register('points_value', { valueAsNumber: true })}
            placeholder="0"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">Category</label>
        <Input {...register('category')} placeholder="e.g. Drinks, Food, Snacks" />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? 'Saving…' : item ? 'Update Item' : 'Add Item'}
        </Button>
      </div>
    </form>
  )
}
