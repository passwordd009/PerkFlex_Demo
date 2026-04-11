import { createClient } from '@/lib/supabase/server'
import { MapView } from '@/components/shared/MapView'
import { PointsBadge } from '@/components/shared/PointsBadge'
import type { Business } from '@/types'

export default async function DiscoverPage() {
  const supabase = await createClient()
  const { data: businesses } = await supabase
    .from('businesses')
    .select('*, districts(id, name)')
    .eq('is_active', true)

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-3 bg-white/90 backdrop-blur-sm z-10 absolute top-0 left-0 right-0">
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Discover</p>
          <h1 className="text-xl font-black text-foreground leading-tight">Local Businesses</h1>
        </div>
        <PointsBadge />
      </div>

      {/* Full-screen map */}
      <div className="flex-1">
        <MapView businesses={(businesses ?? []) as Business[]} />
      </div>
    </div>
  )
}
