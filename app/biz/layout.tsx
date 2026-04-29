import Link from 'next/link'
import { LayoutDashboard, ScanLine, ClipboardList, UtensilsCrossed, Package, Tag } from 'lucide-react'

const nav = [
  { href: '/biz/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/biz/orders', label: 'Orders', icon: ClipboardList },
  { href: '/biz/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/biz/inventory', label: 'Inventory', icon: Package },
  { href: '/biz/discounts', label: 'Discounts', icon: Tag },
  { href: '/biz/scan', label: 'Scan QR', icon: ScanLine },
]

export default function BizLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <main className="pb-20">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex flex-col items-center gap-0.5 flex-1 py-1 text-gray-400 hover:text-primary transition-colors">
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
