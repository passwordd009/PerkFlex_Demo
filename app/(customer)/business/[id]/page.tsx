import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BusinessMenuClient } from './BusinessMenuClient'
import type { Business, InventoryItem, Discount } from '@/types'

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
      .eq('business_id', id),
  ])

  if (!business) notFound()

  return (
    <BusinessMenuClient
      business={business as Business}
      inventoryItems={(inventoryData ?? []) as InventoryItem[]}
      discounts={(discountData ?? []) as Discount[]}
    />
  )
}
