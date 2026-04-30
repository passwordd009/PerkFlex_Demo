'use client'

import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Pencil, Package, Tag, Camera, Star, Plus, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ImageUpload } from '@/components/ImageUpload'
import { InventoryItemForm } from '@/components/business/InventoryItemForm'
import { InventoryCreateForm } from '@/components/business/InventoryCreateForm'
import { DiscountItemForm } from '@/components/business/DiscountItemForm'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'
import type { InventoryItem, Discount, Business } from '@/types'

export default function MenuManagementPage() {
  const queryClient = useQueryClient()
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null)
  const [creatingItem, setCreatingItem] = useState(false)
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<InventoryItem | null>(null)
  const [confirmDeleteDiscount, setConfirmDeleteDiscount] = useState<Discount | null>(null)

  // Business profile edit
  const [editingBiz, setEditingBiz] = useState(false)
  const [bizName, setBizName] = useState('')
  const [bizDescription, setBizDescription] = useState('')
  const [bizLogo, setBizLogo] = useState<string | null>(null)
  const [bizCover, setBizCover] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

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
        .maybeSingle()
      return (data as Business) ?? null
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
      if (error) throw new Error(error.message)
      toast.success('Profile updated')
      queryClient.invalidateQueries({ queryKey: ['my-business'] })
      setEditingBiz(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save profile')
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteItem() {
    if (!confirmDeleteItem) return
    const supabase = createClient()
    const { error } = await supabase.from('inventory').delete().eq('id', confirmDeleteItem.id)
    if (error) { toast.error(error.message); return }
    toast.success('Item deleted')
    setConfirmDeleteItem(null)
    queryClient.invalidateQueries({ queryKey: ['biz-inventory', businessId] })
  }

  async function deleteDiscount() {
    if (!confirmDeleteDiscount) return
    const supabase = createClient()
    const { error } = await supabase.from('discounts').delete().eq('id', confirmDeleteDiscount.id)
    if (error) { toast.error(error.message); return }
    toast.success('Discount deleted')
    setConfirmDeleteDiscount(null)
    queryClient.invalidateQueries({ queryKey: ['biz-discounts', businessId] })
  }

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
        const key = `${item.name.toLowerCase().trim()}:${Number(item.price)}`
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
            {business?.category && (
              <Badge variant="default" className="text-[10px] mt-0.5">{business.category}</Badge>
            )}
            {business?.description && (
              <p className="text-xs text-gray-400 mt-0.5 leading-snug">{business.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="px-4">
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

        {/* ── Rewards tab ── */}
        {activeTab === 'Rewards' && (
          discounts.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-12">
              No discounts yet —{' '}
              <Link href="/biz/discounts" className="text-primary font-semibold underline underline-offset-2">
                create one
              </Link>
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {discounts.map(discount => (
                <div key={discount.id} className="relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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

        {/* ── Inventory category tabs ── */}
        {activeTab !== 'Rewards' && (
          isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-44 rounded-2xl" />)}
            </div>
          ) : currentItems.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Package className="h-10 w-10 mx-auto mb-3 text-gray-200" />
              <p className="text-sm font-medium text-gray-500">No items in your store yet</p>
              <p className="text-xs mt-1 mb-5">Upload inventory to populate your menu</p>
              <Link href="/biz/inventory" className="text-sm font-semibold text-primary underline underline-offset-2">
                Go to Inventory →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {currentItems.map(item => (
                <div key={item.id} className="relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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

      {/* ── Add item FAB ── */}
      {activeTab !== 'Rewards' && businessId && (
        <button
          onClick={() => setCreatingItem(true)}
          className="fixed bottom-24 right-4 z-50 bg-primary text-white rounded-full p-4 shadow-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-5 w-5" />
        </button>
      )}

      {/* ── Create item dialog ── */}
      <Dialog open={creatingItem} onOpenChange={open => { if (!open) setCreatingItem(false) }}>
        <DialogContent className="mx-4">
          <DialogHeader>
            <DialogTitle>Add Item</DialogTitle>
          </DialogHeader>
          {businessId && (
            <InventoryCreateForm
              businessId={businessId}
              onDone={() => {
                setCreatingItem(false)
                queryClient.invalidateQueries({ queryKey: ['biz-inventory', businessId] })
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Edit item dialog ── */}
      <Dialog open={!!editingItem} onOpenChange={open => { if (!open) setEditingItem(null) }}>
        <DialogContent className="mx-4">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <>
              <InventoryItemForm
                item={editingItem}
                onDone={() => {
                  setEditingItem(null)
                  queryClient.invalidateQueries({ queryKey: ['biz-inventory', businessId] })
                }}
              />
              <button
                onClick={() => { setConfirmDeleteItem(editingItem); setEditingItem(null) }}
                className="w-full flex items-center justify-center gap-1 text-xs text-red-500 hover:text-red-600 py-1 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete item
              </button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Edit discount dialog ── */}
      <Dialog open={!!editingDiscount} onOpenChange={open => { if (!open) setEditingDiscount(null) }}>
        <DialogContent className="mx-4">
          <DialogHeader>
            <DialogTitle>Edit Discount</DialogTitle>
          </DialogHeader>
          {editingDiscount && (
            <>
              <DiscountItemForm
                discount={editingDiscount}
                onDone={() => {
                  setEditingDiscount(null)
                  queryClient.invalidateQueries({ queryKey: ['biz-discounts', businessId] })
                }}
              />
              <button
                onClick={() => { setConfirmDeleteDiscount(editingDiscount); setEditingDiscount(null) }}
                className="w-full flex items-center justify-center gap-1 text-xs text-red-500 hover:text-red-600 py-1 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete discount
              </button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Confirm delete item dialog ── */}
      <Dialog open={!!confirmDeleteItem} onOpenChange={open => { if (!open) setConfirmDeleteItem(null) }}>
        <DialogContent className="mx-4">
          <DialogHeader><DialogTitle>Delete Item</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500">
            Delete <strong>{confirmDeleteItem?.name}</strong>? This cannot be undone.
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setConfirmDeleteItem(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={deleteItem}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Confirm delete discount dialog ── */}
      <Dialog open={!!confirmDeleteDiscount} onOpenChange={open => { if (!open) setConfirmDeleteDiscount(null) }}>
        <DialogContent className="mx-4">
          <DialogHeader><DialogTitle>Delete Discount</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500">
            Delete <strong>{confirmDeleteDiscount?.title}</strong>? This cannot be undone.
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setConfirmDeleteDiscount(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={deleteDiscount}>Delete</Button>
          </div>
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
