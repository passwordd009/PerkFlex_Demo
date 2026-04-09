import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function getBusinessDistrict(businessId: string) {
  const { data, error } = await supabase
    .from('businesses')
    .select('district_id, districts(id, name)')
    .eq('id', businessId)
    .single()

  if (error) throw new Error(`Business lookup failed: ${error.message}`)
  return data
}
