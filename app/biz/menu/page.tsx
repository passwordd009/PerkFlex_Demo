'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Pencil, Package, Tag } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { InventoryItemForm } from '@/components/business/InventoryItemForm'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import type { InventoryItem, Discount } from '@/types'

export default function MenuManagementPage() {
  const queryClient = useQueryClient()
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)

  const { data: businessId } = useQuery({
    queryKey: ['my-business-id'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .single()
      return data?.id ?? null
    },
  })

  const { data: inventoryItems = [], isLoading } = useQuery({
    queryKey: ['biz-inventory', businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('inventory')
        .select('*')
        .eq('business_id', businessId!)
        .order('category')
        .order('name')
      const rows = (data ?? []) as InventoryItem[]
      // Deduplicate by name, keeping the most recent row
      const seen = new Set<string>()
      return rows.filter(item => {
        const key = item.name.toLowerCase().trim()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    },
  })

  const { data: discounts = [] } = useQuery({
    queryKey: ['biz-discounts', businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('discounts')
        .select('*')
        .eq('business_id', businessId!)
      return (data ?? []) as Discount[]
    },
  })

  // Map inventoryItemId → first discount that includes it
  const discountMap = new Map<string, Discount>()
  for (const discount of discounts) {
    for (const itemId of discount.item_ids) {
      if (!discountMap.has(itemId)) discountMap.set(itemId, discount)
    }
  }

  // Group items by category, preserving order
  const categories: [string, InventoryItem[]][] = []
  const seen = new Map<string, InventoryItem[]>()
  for (const item of inventoryItems) {
    const cat = item.category || 'Other'
    if (!seen.has(cat)) {
      const group: InventoryItem[] = []
      seen.set(cat, group)
      categories.push([cat, group])
    }
    seen.get(cat)!.push(item)
  }

  return (
    <div className="px-4 pt-12 pb-6">
      <div className="mb-5">
        <h1 className="text-2xl font-black text-foreground">Menu</h1>
        <p className="text-xs text-gray-400 mt-0.5">Customer preview — inventory + active discounts</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-44 rounded-2xl" />)}
        </div>
      ) : inventoryItems.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Package className="h-10 w-10 mx-auto mb-3 text-gray-200" />
          <p className="text-sm font-medium text-gray-500">No items in your store yet</p>
          <p className="text-xs mt-1 mb-5">Upload inventory to populate your menu</p>
          <Link
            href="/biz/inventory"
            className="text-sm font-semibold text-primary underline underline-offset-2"
          >
            Go to Inventory →
          </Link>
        </div>
      ) : (
        <div className="space-y-7">
          {categories.map(([category, items]) => (
            <div key={category}>
              <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                {category}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {items.map(item => {
                  const discount = discountMap.get(item.id)
                  const originalPrice = Number(item.price)
                  const discountedPrice = discount
                    ? originalPrice * (1 - discount.discount_percentage / 100)
                    : null

                  return (
                    <div
                      key={item.id}
                      className="relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                    >
                      {/* Quick-edit button */}
                      <button
                        onClick={() => setEditingItem(item)}
                        className="absolute top-2 right-2 z-10 bg-white/80 backdrop-blur-sm rounded-lg p-1 text-gray-400 hover:text-primary shadow-sm transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>

                      {/* Photo */}
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-28 object-cover"
                        />
                      ) : (
                        <div className="w-full h-28 bg-gray-50 flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-200" />
                        </div>
                      )}

                      <div className="p-3">
                        <p className="text-sm font-semibold text-foreground leading-tight">{item.name}</p>

                        {/* Discount badge */}
                        {discount && (
                          <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md">
                            <Tag className="h-2.5 w-2.5" />
                            {discount.discount_percentage}% off
                          </span>
                        )}

                        {/* Price */}
                        <div className="mt-1.5">
                          {discountedPrice !== null ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs text-gray-400 line-through">
                                {formatCurrency(originalPrice)}
                              </span>
                              <span className="text-sm font-bold text-primary">
                                {formatCurrency(discountedPrice)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm font-bold text-foreground">
                              {formatCurrency(originalPrice)}
                            </span>
                          )}
                        </div>

                        <p className="text-[10px] text-gray-400 mt-1">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit item dialog */}
      <Dialog open={!!editingItem} onOpenChange={open => { if (!open) setEditingItem(null) }}>
        <DialogContent className="mx-4">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <InventoryItemForm
              item={editingItem}
              onDone={() => {
                setEditingItem(null)
                queryClient.invalidateQueries({ queryKey: ['biz-inventory', businessId] })
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
