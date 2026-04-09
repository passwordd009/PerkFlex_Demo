import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BusinessMenuClient } from './BusinessMenuClient'
import type { Business, MenuItem } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function BusinessPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: business }, { data: menuItems }] = await Promise.all([
    supabase
      .from('businesses')
      .select('*, districts(id, name)')
      .eq('id', id)
      .eq('is_active', true)
      .single(),
    supabase
      .from('menu_items')
      .select('*')
      .eq('business_id', id)
      .eq('is_available', true)
      .order('category')
      .order('name'),
  ])

  if (!business) notFound()

  return (
    <BusinessMenuClient
      business={business as Business}
      menuItems={(menuItems ?? []) as MenuItem[]}
    />
  )
}
