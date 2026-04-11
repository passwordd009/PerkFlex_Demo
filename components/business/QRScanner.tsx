'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { verifyApi } from '@/lib/api'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { formatPoints } from '@/lib/utils'

export function QRScanner() {
  const videoRef = useRef<HTMLVideoElement>(null)
  // decodeFromVideoDevice returns a Controls object with stop()
  const controlsRef = useRef<{ stop: () => void } | null>(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; points?: number } | null>(null)

  const { mutate: verifyToken, isPending } = useMutation({
    mutationFn: (token: string) => verifyApi.scan(token),
    onSuccess: (data) => {
      setResult({
        success: true,
        message: `Order verified! Customer earned ${formatPoints(data.pointsAwarded)} points.`,
        points: data.pointsAwarded,
      })
      stopScanning()
    },
    onError: (e: Error) => {
      setResult({ success: false, message: e.message })
      stopScanning()
    },
  })

  const stopScanning = useCallback(() => {
    controlsRef.current?.stop()
    controlsRef.current = null
    setScanning(false)
  }, [])

  const startScanning = useCallback(async () => {
    setResult(null)
    setScanning(true)
    const reader = new BrowserMultiFormatReader()

    try {
      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current!,
        (result, error) => {
          if (result && !isPending) {
            verifyToken(result.getText())
          }
        }
      )
      controlsRef.current = controls
    } catch (e: unknown) {
      toast.error('Camera access denied. Please allow camera access.')
      setScanning(false)
    }
  }, [verifyToken, isPending])

  useEffect(() => {
    return () => {
      controlsRef.current?.stop()
    }
  }, [])

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Camera viewport */}
      <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden bg-black">
        <video ref={videoRef} className="w-full h-full object-cover" muted />

        {scanning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Scan frame */}
            <div className="relative w-56 h-56">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-primary rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-primary rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-primary rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-primary rounded-br-lg" />
              {/* Animated scan line */}
              <motion.div
                className="absolute left-2 right-2 h-0.5 bg-primary/70"
                animate={{ top: ['10%', '90%', '10%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
              />
            </div>
          </div>
        )}

        {!scanning && !result && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Camera className="h-16 w-16 text-white/40" />
          </div>
        )}

        {isPending && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`w-full max-w-sm rounded-2xl p-4 flex items-center gap-3 ${
              result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {result.success ? (
              <CheckCircle className="h-6 w-6 flex-shrink-0" />
            ) : (
              <XCircle className="h-6 w-6 flex-shrink-0" />
            )}
            <p className="text-sm font-medium">{result.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={scanning ? stopScanning : startScanning}
        variant={scanning ? 'outline' : 'default'}
        size="lg"
        className="w-full max-w-sm"
        disabled={isPending}
      >
        {scanning ? 'Stop Scanning' : 'Start Scanning QR Code'}
      </Button>
    </div>
  )
}
