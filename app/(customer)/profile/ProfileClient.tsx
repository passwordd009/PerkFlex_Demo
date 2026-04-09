'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { PointsBadge } from '@/components/shared/PointsBadge'
import { User, LogOut, Star } from 'lucide-react'
import type { Profile } from '@/types'

interface Props {
  profile: Profile | null
}

export function ProfileClient({ profile }: Props) {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="px-4 pt-12 pb-6">
      <h1 className="text-2xl font-black text-foreground mb-6">Profile</h1>

      {/* Avatar */}
      <div className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User className="h-7 w-7 text-white" />
          )}
        </div>
        <div>
          <p className="font-bold text-foreground">{profile?.full_name ?? 'User'}</p>
          <p className="text-xs text-gray-400 capitalize">{profile?.role?.replace('_', ' ')}</p>
          <PointsBadge className="mt-1" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
          <Star className="h-5 w-5 text-support mx-auto mb-1 fill-support" />
          <p className="text-2xl font-black text-foreground">{profile?.points_balance ?? 0}</p>
          <p className="text-xs text-gray-400">points</p>
        </div>
        <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
          <div className="h-5 w-5 rounded-full bg-primary/20 mx-auto mb-1 flex items-center justify-center">
            <span className="text-primary text-xs font-bold">$</span>
          </div>
          <p className="text-2xl font-black text-foreground">
            {((profile?.points_balance ?? 0) / 100).toFixed(0)}
          </p>
          <p className="text-xs text-gray-400">reward value</p>
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={handleSignOut}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    </div>
  )
}
