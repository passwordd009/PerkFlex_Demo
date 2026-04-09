'use client'

import Link from 'next/link'
import { MapPin, ChevronRight, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Business } from '@/types'

interface BusinessCardProps {
  business: Business
  onClose?: () => void
  /** Compact list card (no close button) */
  compact?: boolean
}

export function BusinessCard({ business, onClose, compact = false }: BusinessCardProps) {
  return (
    <Card className="overflow-hidden shadow-xl">
      {/* Cover image */}
      {business.cover_url && !compact && (
        <div
          className="h-28 bg-cover bg-center"
          style={{ backgroundImage: `url(${business.cover_url})` }}
        />
      )}
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Logo */}
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {business.logo_url ? (
              <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-primary font-bold text-lg">{business.name.charAt(0)}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <h3 className="font-bold text-foreground truncate">{business.name}</h3>
              {onClose && (
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {business.category && (
              <Badge variant="default" className="mt-0.5 text-[10px]">{business.category}</Badge>
            )}

            {business.address && (
              <div className="flex items-center gap-1 mt-1 text-gray-500 text-xs">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{business.address}</span>
              </div>
            )}
          </div>
        </div>

        {business.description && !compact && (
          <p className="mt-2 text-sm text-gray-500 line-clamp-2">{business.description}</p>
        )}

        <Link href={`/business/${business.id}`} className="block mt-3">
          <Button className="w-full" size="sm">
            View Menu <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
