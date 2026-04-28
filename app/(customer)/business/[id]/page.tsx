import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BusinessMenuClient } from './BusinessMenuClient'
import type { Business, InventoryItem, Discount } from '@/types'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function BusinessPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: business }, { data: inventoryData }, { data: discountData }] = await Promise.all([
    supabase
      .from('businesses')
      .select('*, districts(id, name)')
      .eq('id', id)
      .eq('is_active', true)
      .single(),
    supabase
      .from('inventory')
      .select('*')
      .eq('business_id', id)
      .order('category')
      .order('name'),
    supabase
      .from('discounts')
      .select('*')
      .eq('business_id', id)
      .order('points_cost'),
  ])

  if (!business) notFound()

  const seen = new Set<string>()
  const inventoryItems = ((inventoryData ?? []) as InventoryItem[]).filter(item => {
    const key = item.name.toLowerCase().trim()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return (
    <BusinessMenuClient
      business={business as Business}
      inventoryItems={inventoryItems}
      discounts={(discountData ?? []) as Discount[]}
    />
  )
}
