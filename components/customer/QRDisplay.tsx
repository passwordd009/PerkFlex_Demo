'use client'

import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { formatCurrency } from '@/lib/utils'
import type { Order } from '@/types'

interface QRDisplayProps {
  order: Order
}

export function QRDisplay({ order }: QRDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !order.qr_token) return
    QRCode.toCanvas(canvasRef.current, order.qr_token, {
      width: 240,
      margin: 2,
      color: { dark: '#6D28D9', light: '#ffffff' },
    })
  }, [order.qr_token])

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <canvas ref={canvasRef} className="block" />
      </div>

      <div className="text-center">
        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Order Total</p>
        <p className="text-3xl font-bold text-foreground">{formatCurrency(order.total)}</p>
        <p className="text-sm text-gray-400 mt-0.5">Pay in person · Show this QR to staff</p>
      </div>

      <div className="bg-primary/5 rounded-xl px-4 py-2 text-center">
        <p className="text-xs text-gray-500">Order #{order.id.slice(0, 8).toUpperCase()}</p>
        <p className="text-xs font-medium text-primary mt-0.5">
          +{order.points_earned} pts earned after verification
        </p>
      </div>
    </div>
  )
}
