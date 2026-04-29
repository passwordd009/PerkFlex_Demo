'use client'

import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Pencil, Package, Tag, Star } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { InventoryItemForm } from '@/components/business/InventoryItemForm'
import { DiscountItemForm } from '@/components/business/DiscountItemForm'
import { formatCurrency } from '@/lib/utils'
import type { InventoryItem, Discount, Business } from '@/types'

export default function MenuManagementPage() {
  const queryClient = useQueryClient()
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null)

  const { data: business } = useQuery<Business | null>({
    queryKey: ['my-business'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .single()
      return (data as Business) ?? null
    },
  })

  const businessId = business?.id

  const { data: inventoryItems = [], isLoading } = useQuery<InventoryItem[]>({
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
      const seen = new Set<string>()
      return rows.filter(item => {
        const key = item.name.toLowerCase().trim()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    },
  })

  const { data: discounts = [] } = useQuery<Discount[]>({
    queryKey: ['biz-discounts', businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('discounts')
        .select('*')
        .eq('business_id', businessId!)
        .order('points_cost')
      return (data ?? []) as Discount[]
    },
  })

  const categories = useMemo(() =>
    Array.from(new Set(inventoryItems.map(i => i.category ?? 'Other')))
  , [inventoryItems])

  const allTabs = useMemo(() => ['Rewards', ...categories], [categories])
  const [selectedTab, setSelectedTab] = useState<string>('')
  const activeTab = selectedTab || categories[0] || 'Rewards'

  const groupedByCategory = useMemo(() => {
    const map = new Map<string, InventoryItem[]>()
    for (const item of inventoryItems) {
      const cat = item.category ?? 'Other'
      map.set(cat, [...(map.get(cat) ?? []), item])
    }
    return map
  }, [inventoryItems])

  const currentItems = groupedByCategory.get(activeTab) ?? []

  return (
    <div>
      {/* Cover */}
      <div
        className="h-48 bg-gradient-to-br from-primary to-secondary"
        style={business?.cover_url ? { backgroundImage: `url(${business.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      />

      <div className="px-4 -mt-6 relative z-10 pb-8">
        {/* Business info card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
              {business?.logo_url ? (
                <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary font-black text-xl">{business?.name?.charAt(0) ?? '?'}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-black text-lg text-foreground leading-tight">{business?.name ?? '…'}</h1>
              {business?.category && (
                <Badge variant="default" className="text-[10px] mt-0.5">{business.category}</Badge>
              )}
              {business?.address && (
                <p className="text-xs text-gray-400 mt-0.5 truncate">{business.address}</p>
              )}
            </div>
          </div>
          {business?.description && (
            <p className="text-sm text-gray-500 mt-2">{business.description}</p>
          )}
        </div>

        {/* Category tab bar */}
        {isLoading ? (
          <div className="flex gap-2 mb-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-8 w-20 rounded-full" />)}
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            {allTabs.map(tab => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  activeTab === tab
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {/* Rewards tab */}
        {activeTab === 'Rewards' && (
          discounts.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-12">No discounts yet — create one from the Discounts tab</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {discounts.map(discount => (
                <div key={discount.id} className="relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Edit button */}
                  <button
                    onClick={() => setEditingDiscount(discount)}
                    className="absolute top-2 right-2 z-10 bg-white/80 backdrop-blur-sm rounded-lg p-1 text-gray-400 hover:text-primary shadow-sm transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>

                  <div className="w-full h-28 bg-primary/5 flex flex-col items-center justify-center gap-1">
                    <Tag className="h-8 w-8 text-primary/40" />
                    <span className="text-2xl font-black text-primary">{discount.discount_percentage}%</span>
                    <span className="text-[10px] text-gray-400 font-medium">off</span>
                  </div>

                  <div className="p-3">
                    <div className="flex items-center gap-1 mb-0.5">
                      <p className="text-sm font-semibold text-foreground leading-tight truncate">{discount.title}</p>
                      {discount.is_combo && (
                        <span className="flex-shrink-0 text-[9px] font-bold px-1 py-0.5 rounded bg-amber-100 text-amber-700">Combo</span>
                      )}
                    </div>
                    {discount.description && (
                      <p className="text-xs text-gray-400 leading-tight">{discount.description}</p>
                    )}
                    <div className="flex items-center gap-0.5 mt-1.5">
                      <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                      <span className="text-sm font-bold text-amber-700">{discount.points_cost} pts</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Inventory category tabs */}
        {activeTab !== 'Rewards' && (
          isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-44 rounded-2xl" />)}
            </div>
          ) : currentItems.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-12">No items in this category</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {currentItems.map(item => (
                <div key={item.id} className="relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Edit button */}
                  <button
                    onClick={() => setEditingItem(item)}
                    className="absolute top-2 right-2 z-10 bg-white/80 backdrop-blur-sm rounded-lg p-1 text-gray-400 hover:text-primary shadow-sm transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>

                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-28 object-cover" />
                  ) : (
                    <div className="w-full h-28 bg-gray-50 flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-200" />
                    </div>
                  )}

                  <div className="p-3">
                    <p className="text-sm font-semibold text-foreground leading-tight">{item.name}</p>
                    <p className="text-sm font-bold text-foreground mt-1.5">{formatCurrency(Number(item.price))}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

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

      {/* Edit discount dialog */}
      <Dialog open={!!editingDiscount} onOpenChange={open => { if (!open) setEditingDiscount(null) }}>
        <DialogContent className="mx-4">
          <DialogHeader>
            <DialogTitle>Edit Discount</DialogTitle>
          </DialogHeader>
          {editingDiscount && (
            <DiscountItemForm
              discount={editingDiscount}
              onDone={() => {
                setEditingDiscount(null)
                queryClient.invalidateQueries({ queryKey: ['biz-discounts', businessId] })
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
