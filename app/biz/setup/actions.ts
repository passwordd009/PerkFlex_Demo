'use server'

import { createClient as createAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function createBusiness(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = (formData.get('name') as string).trim()
  const category = formData.get('category') as string
  const description = (formData.get('description') as string | null)?.trim() || null
  const address = (formData.get('address') as string | null)?.trim() || null

  if (!name) throw new Error('Business name is required')

  const { error } = await supabaseAdmin
    .from('businesses')
    .insert({ owner_id: user.id, name, category, description, address, is_active: true })

  if (error) throw new Error(error.message)
  redirect('/biz/dashboard')
}
