'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Map, Search, ShoppingBag, Gift, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/discover', label: 'Discover', icon: Map },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/rewards', label: 'Rewards', icon: Gift },
  { href: '/profile', label: 'Profile', icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 flex-1 py-1 relative"
            >
              <div className="relative flex flex-col items-center">
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon
                  className={cn(
                    'h-5 w-5 transition-colors',
                    active ? 'text-primary' : 'text-gray-400'
                  )}
                />
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-gray-400'
                )}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
