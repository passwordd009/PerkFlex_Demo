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
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import type { MenuItem } from '@/types'

export default function MenuManagementPage() {
  const queryClient = useQueryClient()
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [showForm, setShowForm] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['business-menu'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { businessId: '', items: [] as MenuItem[] }

      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      if (!business) return { businessId: '', items: [] as MenuItem[] }

      const { data: items } = await supabase
        .from('menu_items')
        .select('*')
        .eq('business_id', business.id)
        .order('category')
        .order('name')

      return { businessId: business.id, items: (items ?? []) as MenuItem[] }
    },
  })

  const { mutate: toggleAvailability } = useMutation({
    mutationFn: async ({ id, is_available }: { id: string; is_available: boolean }) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['business-menu'] }),
    onError: (e: Error) => toast.error(e.message),
  })

  const { mutate: deleteItem } = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('menu_items').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-menu'] })
      toast.success('Item deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const businessId = data?.businessId ?? ''
  const items = data?.items ?? []

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
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm mb-4">Your menu is empty</p>
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
                className="bg-white rounded-2xl p-3 border border-gray-100 flex items-center gap-3 shadow-sm"
              >
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
                    {item.is_available ? (
                      <ToggleRight className="h-6 w-6" />
                    ) : (
                      <ToggleLeft className="h-6 w-6" />
                    )}
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
    </div>
  )
}
