'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { CSVUpload } from '@/components/business/CSVUpload'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'

interface InventoryItem {
  id: string
  name: string
  price: number
  quantity: number
  category: string
}

function InventoryList({ businessId }: { businessId: string }) {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inventory', businessId],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('inventory')
        .select('id, name, price, quantity, category')
        .eq('business_id', businessId)
        .order('category')
        .order('name')
      if (error) throw error
      return data as InventoryItem[]
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
      </div>
    )
  }

  if (items.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">No inventory items yet</p>
  }

  return (
    <div className="space-y-2">
      {items.map(item => (
        <div
          key={item.id}
          className="bg-white rounded-2xl p-3 border border-gray-100 flex items-center gap-3 shadow-sm"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm truncate">{item.name}</p>
              <Badge variant="outline" className="text-[10px] py-0">{item.category}</Badge>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {formatCurrency(item.price)} · Qty: {item.quantity}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function InventoryPage() {
  const queryClient = useQueryClient()

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

  function handleUploadDone() {
    if (businessId) {
      queryClient.invalidateQueries({ queryKey: ['inventory', businessId] })
    }
  }

  return (
    <div className="px-4 pt-12 pb-6 max-w-lg mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-foreground">Inventory Upload</h1>
        <p className="text-sm text-gray-400 mt-1">
          Upload a CSV file to bulk-add inventory items. Any column names work — just map them below.
        </p>
      </div>

      <CSVUpload onDone={handleUploadDone} />

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Current Inventory</h2>
        {businessId ? (
          <InventoryList businessId={businessId} />
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">No business found</p>
        )}
      </div>
    </div>
  )
}
