'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox'
import type { MapRef } from 'react-map-gl/mapbox'
import { motion, AnimatePresence } from 'framer-motion'
import { Coffee, Utensils, ShoppingBag, Scissors, Dumbbell, Landmark } from 'lucide-react'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Business } from '@/types'
import { BusinessMapCard } from '@/components/customer/BusinessMapCard'

interface DiscountInfo {
  title: string
  discount_percentage: number
  points_cost: number
}

interface MapViewProps {
  businesses: Business[]
  discountByBiz?: Record<string, DiscountInfo>
  initialLat?: number
  initialLng?: number
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

function getCategoryIcon(category: string | null) {
  const c = category?.toLowerCase() ?? ''
  if (c.includes('cafe') || c.includes('coffee') || c.includes('bakery')) return Coffee
  if (c.includes('dining') || c.includes('restaurant') || c.includes('food') || c.includes('bar')) return Utensils
  if (c.includes('salon') || c.includes('barber') || c.includes('beauty') || c.includes('spa')) return Scissors
  if (c.includes('gym') || c.includes('fitness') || c.includes('sport')) return Dumbbell
  if (c.includes('shop') || c.includes('retail') || c.includes('store') || c.includes('boutique')) return ShoppingBag
  if (c.includes('service') || c.includes('bank') || c.includes('finance')) return Landmark
  return ShoppingBag
}

export function MapView({ businesses, discountByBiz = {}, initialLat = 41.8781, initialLng = -87.6298 }: MapViewProps) {
  const mapRef = useRef<MapRef>(null)
  const [isFollowing, setIsFollowing] = useState(true)
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)

  const [viewState, setViewState] = useState({
    latitude: initialLat,
    longitude: initialLng,
    zoom: 13,
  })

  const lastPositionRef = useRef({ latitude: initialLat, longitude: initialLng })
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null)
  const hasInteractedRef = useRef(false)

  useEffect(() => {
    return () => { if (resetTimerRef.current) clearTimeout(resetTimerRef.current) }
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) return
    const watchId = navigator.geolocation.watchPosition(
      ({ coords: { latitude, longitude } }) => {
        lastPositionRef.current = { latitude, longitude }
        if (isFollowing) setViewState({ latitude, longitude, zoom: 15 })
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [isFollowing])

  const handleMarkerClick = useCallback((business: Business) => {
    setSelectedBusiness(business)
    if (business.lat && business.lng) {
      mapRef.current?.flyTo({ center: [business.lng, business.lat], zoom: 15, duration: 800 })
    }
  }, [])

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(e) => {
          setViewState(e.viewState)
          if (!hasInteractedRef.current) {
            hasInteractedRef.current = true
            setIsFollowing(false)
          }
          if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
          resetTimerRef.current = setTimeout(() => {
            setIsFollowing(true)
            hasInteractedRef.current = false
            const { latitude, longitude } = lastPositionRef.current
            mapRef.current?.flyTo({ center: [longitude, latitude], zoom: 15, duration: 800 })
          }, 15000)
        }}
        mapStyle="mapbox://styles/projecthestia/cmolpoqz6001201s684dlcac2"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        {/* User location dot */}
        <Marker
          latitude={lastPositionRef.current.latitude}
          longitude={lastPositionRef.current.longitude}
          anchor="center"
        >
          <div className="w-5 h-5 bg-blue-500 rounded-full border-3 border-white shadow-lg ring-4 ring-blue-500/20" />
        </Marker>

        {/* Business markers */}
        {businesses.map(biz =>
          biz.lat && biz.lng ? (
            <Marker
              key={biz.id}
              latitude={biz.lat}
              longitude={biz.lng}
              anchor="bottom"
              onClick={(e: { originalEvent: MouseEvent }) => {
                e.originalEvent.stopPropagation()
                handleMarkerClick(biz)
              }}
            >
              <BusinessMarker
                business={biz}
                selected={selectedBusiness?.id === biz.id}
              />
            </Marker>
          ) : null
        )}
      </Map>

      {/* Tap on map to deselect */}
      {selectedBusiness && (
        <div
          className="absolute inset-0 z-0"
          onClick={() => setSelectedBusiness(null)}
        />
      )}

      {/* Bottom card */}
      <AnimatePresence>
        {selectedBusiness && (
          <motion.div
            key={selectedBusiness.id}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="absolute bottom-0 left-0 right-0 z-10 p-4 pb-6"
          >
            <BusinessMapCard
              business={selectedBusiness}
              discount={discountByBiz[selectedBusiness.id] ?? null}
              onClose={() => setSelectedBusiness(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function BusinessMarker({ business, selected }: { business: Business; selected: boolean }) {
  const Icon = getCategoryIcon(business.category)
  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      animate={{ scale: selected ? 1.2 : 1 }}
      className="flex flex-col items-center cursor-pointer"
    >
      <div className={`
        flex items-center gap-1.5 rounded-full px-3 py-2 shadow-lg border-2 border-white transition-colors
        ${selected ? 'bg-primary scale-110' : 'bg-primary'}
      `}>
        <Icon className="h-4 w-4 text-white" />
        {selected && (
          <span className="text-white text-xs font-bold max-w-[80px] truncate">
            {business.name}
          </span>
        )}
      </div>
      {/* Pin tail */}
      <div className="w-2 h-2 bg-primary rotate-45 -mt-1 shadow-sm" />
    </motion.div>
  )
}
