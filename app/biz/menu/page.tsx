'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Pencil, Package, Tag, Camera } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ImageUpload } from '@/components/ImageUpload'
import { InventoryItemForm } from '@/components/business/InventoryItemForm'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'
import type { InventoryItem, Discount } from '@/types'

type BizProfile = {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  cover_url: string | null
}

export default function MenuManagementPage() {
  const queryClient = useQueryClient()
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)

  // Business profile edit
  const [editingBiz, setEditingBiz] = useState(false)
  const [bizName, setBizName] = useState('')
  const [bizDescription, setBizDescription] = useState('')
  const [bizLogo, setBizLogo] = useState<string | null>(null)
  const [bizCover, setBizCover] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const { data: business } = useQuery<BizProfile | null>({
    queryKey: ['my-business'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data } = await supabase
        .from('businesses')
        .select('id, name, description, logo_url, cover_url')
        .eq('owner_id', user.id)
        .maybeSingle()
      return data ?? null
    },
  })

  const businessId = business?.id

  function openBizEdit() {
    if (!business) return
    setBizName(business.name)
    setBizDescription(business.description ?? '')
    setBizLogo(business.logo_url)
    setBizCover(business.cover_url)
    setEditingBiz(true)
  }

  async function saveBiz() {
    if (!business) return
    setIsSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('businesses')
        .update({
          name: bizName.trim(),
          description: bizDescription.trim() || null,
          logo_url: bizLogo,
          cover_url: bizCover,
        })
        .eq('id', business.id)
      if (error) throw error
      toast.success('Profile updated')
      queryClient.invalidateQueries({ queryKey: ['my-business'] })
      setEditingBiz(false)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setIsSaving(false)
    }
  }

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

  const discountMap = new Map<string, Discount>()
  for (const discount of discounts) {
    for (const itemId of discount.item_ids) {
      if (!discountMap.has(itemId)) discountMap.set(itemId, discount)
    }
  }

  const categories: [string, InventoryItem[]][] = []
  const catSeen = new Map<string, InventoryItem[]>()
  for (const item of inventoryItems) {
    const cat = item.category || 'Other'
    if (!catSeen.has(cat)) {
      const group: InventoryItem[] = []
      catSeen.set(cat, group)
      categories.push([cat, group])
    }
    catSeen.get(cat)!.push(item)
  }

  return (
    <div className="pb-6">
      {/* ── Business header ── */}
      <div className="relative">
        {/* Cover banner */}
        <div className="relative w-full h-36 bg-gray-100">
          {business?.cover_url ? (
            <img src={business.cover_url} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20" />
          )}
          <button
            onClick={openBizEdit}
            className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors"
          >
            <Camera className="h-4 w-4" />
          </button>
        </div>

        {/* Logo + name row */}
        <div className="px-4 pt-3 pb-4 flex items-start gap-3">
          {/* Logo */}
          <div className="relative -mt-8 shrink-0">
            <div className="w-16 h-16 rounded-2xl border-2 border-white shadow-sm overflow-hidden bg-gray-100">
              {business?.logo_url ? (
                <img src={business.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl font-black text-primary">
                    {business?.name?.[0] ?? '?'}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={openBizEdit}
              className="absolute -bottom-1 -right-1 bg-white border border-gray-200 rounded-full p-0.5 shadow-sm hover:text-primary transition-colors"
            >
              <Pencil className="h-2.5 w-2.5" />
            </button>
          </div>

          {/* Name + description */}
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-black text-foreground truncate">
                {business?.name ?? '…'}
              </h1>
              <button onClick={openBizEdit} className="text-gray-400 hover:text-primary transition-colors shrink-0">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
            {business?.description && (
              <p className="text-xs text-gray-400 mt-0.5 leading-snug">{business.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Inventory grid ── */}
      <div className="px-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-44 rounded-2xl" />)}
          </div>
        ) : inventoryItems.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Package className="h-10 w-10 mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium text-gray-500">No items in your store yet</p>
            <p className="text-xs mt-1 mb-5">Upload inventory to populate your menu</p>
            <Link href="/biz/inventory" className="text-sm font-semibold text-primary underline underline-offset-2">
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

                          {discount && (
                            <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md">
                              <Tag className="h-2.5 w-2.5" />
                              {discount.discount_percentage}% off
                            </span>
                          )}

                          <div className="mt-1.5">
                            {discountedPrice !== null ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs text-gray-400 line-through">{formatCurrency(originalPrice)}</span>
                                <span className="text-sm font-bold text-primary">{formatCurrency(discountedPrice)}</span>
                              </div>
                            ) : (
                              <span className="text-sm font-bold text-foreground">{formatCurrency(originalPrice)}</span>
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
      </div>

      {/* ── Edit item dialog ── */}
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

      {/* ── Edit business profile dialog ── */}
      <Dialog open={editingBiz} onOpenChange={open => { if (!open) setEditingBiz(false) }}>
        <DialogContent className="mx-4">
          <DialogHeader>
            <DialogTitle>Edit Business Profile</DialogTitle>
          </DialogHeader>
          {business && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Cover Photo</label>
                <ImageUpload
                  value={bizCover}
                  bucket="ember"
                  path={`business/${business.id}/cover`}
                  onUpload={setBizCover}
                  onClear={() => setBizCover(null)}
                  aspectRatio="wide"
                  placeholder="Upload cover photo"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Logo</label>
                <ImageUpload
                  value={bizLogo}
                  bucket="ember"
                  path={`business/${business.id}/logo`}
                  onUpload={setBizLogo}
                  onClear={() => setBizLogo(null)}
                  placeholder="Upload logo"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Business Name</label>
                <Input
                  value={bizName}
                  onChange={e => setBizName(e.target.value)}
                  placeholder="Business name"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <Input
                  value={bizDescription}
                  onChange={e => setBizDescription(e.target.value)}
                  placeholder="Short description"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setEditingBiz(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={saveBiz} disabled={isSaving || !bizName.trim()}>
                  {isSaving ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
