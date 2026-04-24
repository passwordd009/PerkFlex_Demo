'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { MenuItemForm } from '@/components/business/MenuItemForm'
import { InventoryItemForm } from '@/components/business/InventoryItemForm'
import { DiscountItemForm } from '@/components/business/DiscountItemForm'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import type { MenuItem, InventoryItem, Discount } from '@/types'

type Tab = 'menu' | 'inventory' | 'discounts'

const TABS: { id: Tab; label: string }[] = [
  { id: 'menu', label: 'Menu Items' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'discounts', label: 'Discounts' },
]

function Thumb({ url, alt }: { url: string | null; alt: string }) {
  if (!url) return null
  return <img src={url} alt={alt} className="h-12 w-12 rounded-xl object-cover shrink-0" />
}

export default function MenuManagementPage() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('menu')

  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null)
  const [showMenuForm, setShowMenuForm] = useState(false)

  const [editingInventoryItem, setEditingInventoryItem] = useState<InventoryItem | null>(null)
  const [showInventoryForm, setShowInventoryForm] = useState(false)

  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null)
  const [showDiscountForm, setShowDiscountForm] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['business-menu'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      if (!business) return null

      const [menuResult, inventoryResult, discountsResult] = await Promise.all([
        supabase.from('menu_items').select('*').eq('business_id', business.id).order('category').order('name'),
        supabase.from('inventory').select('*').eq('business_id', business.id).order('name'),
        supabase.from('discounts').select('*').eq('business_id', business.id).order('created_at', { ascending: false }),
      ])

      return {
        businessId: business.id,
        menuItems: (menuResult.data ?? []) as MenuItem[],
        inventoryItems: (inventoryResult.data ?? []) as InventoryItem[],
        discounts: (discountsResult.data ?? []) as Discount[],
      }
    },
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['business-menu'] })

  const { mutate: toggleAvailability } = useMutation({
    mutationFn: async ({ id, is_available }: { id: string; is_available: boolean }) => {
      const supabase = createClient()
      const { error } = await supabase.from('menu_items').update({ is_available }).eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  })

  const { mutate: deleteMenuItem } = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('menu_items').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { invalidate(); toast.success('Item deleted') },
    onError: (e: Error) => toast.error(e.message),
  })

  const businessId = data?.businessId ?? ''
  const menuItems = data?.menuItems ?? []
  const inventoryItems = data?.inventoryItems ?? []
  const discounts = data?.discounts ?? []

  return (
    <div className="px-4 pt-12 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-black text-foreground">Menu</h1>
        {tab === 'menu' && (
          <Button
            size="sm"
            onClick={() => { setEditingMenuItem(null); setShowMenuForm(true) }}
            disabled={!businessId}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Item
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              tab === t.id ? 'bg-white text-foreground shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : (
        <>
          {/* ── Menu Items ── */}
          {tab === 'menu' && (
            menuItems.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400 text-sm mb-4">Your menu is empty</p>
                <Button onClick={() => { setEditingMenuItem(null); setShowMenuForm(true) }}>
                  <Plus className="h-4 w-4 mr-2" /> Add First Item
                </Button>
              </div>
            ) : (
              <AnimatePresence>
                <div className="space-y-2">
                  {menuItems.map(item => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-white rounded-2xl p-3 border border-gray-100 flex items-center gap-3 shadow-sm"
                    >
                      <Thumb url={item.image_url} alt={item.name} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm truncate">{item.name}</p>
                          {item.category && (
                            <Badge variant="outline" className="text-[10px] py-0">{item.category}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{formatCurrency(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleAvailability({ id: item.id, is_available: !item.is_available })}
                          className={item.is_available ? 'text-green-500' : 'text-gray-300'}
                        >
                          {item.is_available
                            ? <ToggleRight className="h-6 w-6" />
                            : <ToggleLeft className="h-6 w-6" />}
                        </button>
                        <button
                          onClick={() => { setEditingMenuItem(item); setShowMenuForm(true) }}
                          className="text-gray-400 hover:text-primary p-1"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteMenuItem(item.id)}
                          className="text-gray-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )
          )}

          {/* ── Inventory ── */}
          {tab === 'inventory' && (
            inventoryItems.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-sm">No inventory items yet.</p>
                <p className="text-xs mt-1">Upload a CSV from the Inventory page.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {inventoryItems.map(item => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-3 border border-gray-100 flex items-center gap-3 shadow-sm"
                  >
                    <Thumb url={item.image_url} alt={item.name} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate">{item.name}</p>
                        <Badge variant="outline" className="text-[10px] py-0 capitalize">{item.category}</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-gray-500">{formatCurrency(Number(item.price))}</p>
                        <span className="text-gray-300">·</span>
                        <p className="text-xs text-gray-400">Qty {item.quantity}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setEditingInventoryItem(item); setShowInventoryForm(true) }}
                      className="text-gray-400 hover:text-primary p-1"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ── Discounts ── */}
          {tab === 'discounts' && (
            discounts.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-sm">No discounts yet.</p>
                <p className="text-xs mt-1">Create one from the Discounts page.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {discounts.map(discount => (
                  <div
                    key={discount.id}
                    className="bg-white rounded-2xl p-3 border border-gray-100 flex items-center gap-3 shadow-sm"
                  >
                    <Thumb url={discount.image_url} alt={discount.title} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate">{discount.title}</p>
                        <Badge className="text-[10px] py-0 bg-red-50 text-red-500 border border-red-100 shadow-none">
                          {discount.discount_percentage}% off
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {discount.item_ids.length} item{discount.item_ids.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => { setEditingDiscount(discount); setShowDiscountForm(true) }}
                      className="text-gray-400 hover:text-primary p-1"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}

      {/* ── Dialogs ── */}
      <Dialog open={showMenuForm} onOpenChange={setShowMenuForm}>
        <DialogContent className="mx-4">
          <DialogHeader>
            <DialogTitle>{editingMenuItem ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
          </DialogHeader>
          {businessId && (
            <MenuItemForm
              businessId={businessId}
              item={editingMenuItem ?? undefined}
              onDone={() => setShowMenuForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showInventoryForm} onOpenChange={open => { if (!open) setShowInventoryForm(false) }}>
        <DialogContent className="mx-4">
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
          </DialogHeader>
          {editingInventoryItem && (
            <InventoryItemForm
              item={editingInventoryItem}
              onDone={() => { setShowInventoryForm(false); invalidate() }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showDiscountForm} onOpenChange={open => { if (!open) setShowDiscountForm(false) }}>
        <DialogContent className="mx-4">
          <DialogHeader>
            <DialogTitle>Edit Discount</DialogTitle>
          </DialogHeader>
          {editingDiscount && (
            <DiscountItemForm
              discount={editingDiscount}
              onDone={() => { setShowDiscountForm(false); invalidate() }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
