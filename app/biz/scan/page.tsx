import { QRScanner } from '@/components/business/QRScanner'

export default function ScanPage() {
  return (
    <div className="px-4 pt-12 pb-6">
      <h1 className="text-2xl font-black text-foreground mb-2">Scan QR Code</h1>
      <p className="text-sm text-gray-500 mb-8">
        Point your camera at the customer&apos;s QR code to verify their order and award points.
      </p>
      <QRScanner />
    </div>
  )
}
