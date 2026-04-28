import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BusinessMenuClient } from './BusinessMenuClient'
import type { Business, InventoryItem, Reward } from '@/types'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function BusinessPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: business }, { data: inventoryData }, { data: rewardsData }] = await Promise.all([
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
      .from('rewards')
      .select('*')
      .eq('business_id', id)
      .eq('is_active', true)
      .order('points_cost'),
  ])

  if (!business) notFound()

  // Deduplicate by name, keeping the first (earliest) occurrence
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
      rewards={(rewardsData ?? []) as Reward[]}
    />
  )
}
