import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile, error} = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  if (error || !profile) {
    redirect('/discover') // fallback or onboarding
  }
  
  if (profile?.role === 'business_owner') redirect('/biz/dashboard')
  redirect('/discover')
}
