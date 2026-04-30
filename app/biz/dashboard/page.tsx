import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ScanLine, ClipboardList, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { AccountActions } from '@/components/business/AccountActions'

export default async function BusinessDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'business_owner') redirect('/discover')

  // Get business owned by this user
  const { data: business } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!business) redirect('/biz/setup')

  // Get summary stats
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [{ data: pendingOrders }, { data: todayOrders }] = await Promise.all([
    supabase
      .from('orders')
      .select('id')
      .eq('business_id', business?.id)
      .in('status', ['pending', 'confirmed', 'ready']),
    supabase
      .from('orders')
      .select('total')
      .eq('business_id', business?.id)
      .eq('status', 'completed')
      .gte('verified_at', today.toISOString()),
  ])

  const todayRevenue = todayOrders?.reduce((sum: number, o: any) => sum + o.total, 0) ?? 0

  return (
    <div className="px-4 pt-12 pb-6">
      <div className="mb-6">
        <p className="text-xs text-gray-400 uppercase tracking-wide">Business</p>
        <h1 className="text-2xl font-black text-foreground">{business?.name ?? 'Dashboard'}</h1>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card>
          <CardContent className="p-4">
            <TrendingUp className="h-5 w-5 text-primary mb-2" />
            <p className="text-2xl font-black">{formatCurrency(todayRevenue)}</p>
            <p className="text-xs text-gray-400">Today&apos;s revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <ClipboardList className="h-5 w-5 text-secondary mb-2" />
            <p className="text-2xl font-black">{pendingOrders?.length ?? 0}</p>
            <p className="text-xs text-gray-400">Active orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="space-y-3">
        <Link href="/biz/scan">
          <Button className="w-full" size="lg">
            <ScanLine className="h-5 w-5 mr-2" /> Scan Customer QR
          </Button>
        </Link>
        <Link href="/biz/orders">
          <Button variant="outline" className="w-full" size="lg">
            <ClipboardList className="h-4 w-4 mr-2" /> View All Orders
          </Button>
        </Link>
      </div>

      <AccountActions />

    </div>
  )
}
