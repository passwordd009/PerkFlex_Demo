'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function createProfile(userId: string, role: string) {
  const { error } = await supabaseAdmin
    .from('profiles')
    .upsert({ id: userId, role})

  if (error) throw new Error(error.message)
}
