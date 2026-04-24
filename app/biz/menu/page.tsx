'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Tag, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { MenuItemForm } from '@/components/business/MenuItemForm'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import type { MenuItem } from '@/types'

const POINTS_PER_DOLLAR = 100

function calcPointsCost(price: number, discountPct: number) {
  return Math.round(price * (discountPct / 100) * POINTS_PER_DOLLAR)
}

export default function MenuManagementPage() {
  const queryClient = useQueryClient()
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [discountItem, setDiscountItem] = useState<MenuItem | null>(null)
  const [discountPct, setDiscountPct] = useState(20)

  // Fetch business id separately so it can be used in query keys
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

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['biz-menu', businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('menu_items')
        .select('*')
        .eq('business_id', businessId!)
        .order('category')
        .order('name')
      return (data ?? []) as MenuItem[]
    },
  })

  const { mutate: toggleAvailability } = useMutation({
    mutationFn: async ({ id, is_available }: { id: string; is_available: boolean }) => {
      const supabase = createClient()
      const { error } = await supabase.from('menu_items').update({ is_available }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['biz-menu', businessId] }),
    onError: (e: Error) => toast.error(e.message),
  })

  const { mutate: deleteItem } = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('menu_items').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biz-menu', businessId] })
      toast.success('Item deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const { mutate: setDiscount, isPending: settingDiscount } = useMutation({
    mutationFn: async ({ item, pct }: { item: MenuItem; pct: number }) => {
      const supabase = createClient()

      const { error: itemError } = await supabase
        .from('menu_items')
        .update({ discount_pct: pct })
        .eq('id', item.id)
      if (itemError) throw itemError

      // Deactivate any prior discount rewards for this item
      await supabase
        .from('rewards')
        .update({ is_active: false })
        .eq('menu_item_id', item.id)

      const pointsCost = calcPointsCost(item.price, pct)
      const { error: rewardError } = await supabase.from('rewards').insert({
        business_id: businessId,
        menu_item_id: item.id,
        name: `${pct}% off ${item.name}`,
        description: `Get ${item.name} at ${pct}% off`,
        discount_type: 'percentage',
        discount_amount: pct,
        points_cost: pointsCost,
        is_active: true,
      })
      if (rewardError) throw rewardError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biz-menu', businessId] })
      toast.success('Discount reward created')
      setDiscountItem(null)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const { mutate: removeDiscount } = useMutation({
    mutationFn: async (item: MenuItem) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('menu_items')
        .update({ discount_pct: null })
        .eq('id', item.id)
      if (error) throw error
      await supabase.from('rewards').update({ is_active: false }).eq('menu_item_id', item.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biz-menu', businessId] })
      toast.success('Discount removed')
      setDiscountItem(null)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  function openDiscountDialog(item: MenuItem) {
    setDiscountItem(item)
    setDiscountPct(item.discount_pct ?? 20)
  }

  return (
    <div className="px-4 pt-12 pb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-foreground">Menu</h1>
        <Button
          size="sm"
          onClick={() => { setEditingItem(null); setShowForm(true) }}
          disabled={!businessId}
        >
          <Plus className="h-4 w-4 mr-1" /> Add Item
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm mb-4">Your menu is empty — upload inventory or add items manually</p>
          <Button onClick={() => { setEditingItem(null); setShowForm(true) }}>
            <Plus className="h-4 w-4 mr-2" /> Add First Item
          </Button>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-2">
            {items.map(item => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{item.name}</p>
                      {item.category && (
                        <Badge variant="outline" className="text-[10px] py-0">{item.category}</Badge>
                      )}
                      {item.discount_pct && (
                        <Badge className="text-[10px] py-0 bg-secondary text-white border-0">
                          {item.discount_pct}% off reward
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-gray-500">{formatCurrency(item.price)}</p>
                      {item.discount_pct && (
                        <p className="text-xs text-secondary font-medium">
                          → {formatCurrency(item.price * (1 - item.discount_pct / 100))} discounted
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openDiscountDialog(item)}
                      className={`p-1 transition-colors ${item.discount_pct ? 'text-secondary' : 'text-gray-400 hover:text-secondary'}`}
                      title="Set discount"
                    >
                      <Tag className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => toggleAvailability({ id: item.id, is_available: !item.is_available })}
                      className={item.is_available ? 'text-green-500' : 'text-gray-300'}
                    >
                      {item.is_available ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                    </button>
                    <button
                      onClick={() => { setEditingItem(item); setShowForm(true) }}
                      className="text-gray-400 hover:text-primary p-1"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Add/Edit dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="mx-4">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
          </DialogHeader>
          {businessId && (
            <MenuItemForm
              businessId={businessId}
              item={editingItem ?? undefined}
              onDone={() => setShowForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Discount dialog */}
      <Dialog open={!!discountItem} onOpenChange={open => { if (!open) setDiscountItem(null) }}>
        <DialogContent className="mx-4">
          <DialogHeader>
            <DialogTitle>Set Discount Reward</DialogTitle>
          </DialogHeader>
          {discountItem && (
            <div className="space-y-5">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="font-semibold text-sm">{discountItem.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">Original price: {formatCurrency(discountItem.price)}</p>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">Discount</label>
                  <span className="text-sm font-bold text-secondary">{discountPct}% off</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={discountPct}
                  onChange={e => setDiscountPct(Number(e.target.value))}
                  className="w-full accent-secondary"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>10%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="bg-secondary/5 rounded-xl p-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Discounted price</span>
                  <span className="font-semibold">{formatCurrency(discountItem.price * (1 - discountPct / 100))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Points cost for customers</span>
                  <span className="font-semibold text-secondary">{calcPointsCost(discountItem.price, discountPct).toLocaleString()} pts</span>
                </div>
                <p className="text-[10px] text-gray-400 pt-1">
                  Customers earn 10 pts/$1 spent · 100 pts = $1 off
                </p>
              </div>

              <div className="flex gap-2">
                {discountItem.discount_pct && (
                  <Button
                    variant="outline"
                    className="flex-1 text-red-500 border-red-200 hover:bg-red-50"
                    onClick={() => removeDiscount(discountItem)}
                  >
                    <X className="h-4 w-4 mr-1" /> Remove
                  </Button>
                )}
                <Button
                  className="flex-1"
                  onClick={() => setDiscount({ item: discountItem, pct: discountPct })}
                  disabled={settingDiscount}
                >
                  {settingDiscount ? 'Saving…' : 'Save Discount'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
