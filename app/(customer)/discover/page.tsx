import { createClient } from '@/lib/supabase/server'
import { DiscoverClient } from '@/components/customer/DiscoverClient'
import type { Business } from '@/types'

export default async function DiscoverPage() {
  const supabase = await createClient()

  const [{ data: businesses }, { data: discounts }] = await Promise.all([
    supabase
      .from('businesses')
      .select('*, districts(id, name)')
      .eq('is_active', true),
    supabase
      .from('discounts')
      .select('business_id, title, discount_percentage, points_cost')
      .order('points_cost'),
  ])

  // first discount per business
  const discountByBiz: Record<string, { title: string; discount_percentage: number; points_cost: number }> = {}
  for (const d of discounts ?? []) {
    if (!discountByBiz[d.business_id]) discountByBiz[d.business_id] = d
  }

  return (
    <DiscoverClient
      businesses={(businesses ?? []) as Business[]}
      discountByBiz={discountByBiz}
    />
  )
}
