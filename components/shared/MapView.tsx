'use client'

import { useCallback, useRef, useState } from 'react'
import Map, { Marker, GeolocateControl, NavigationControl } from 'react-map-gl/mapbox'
import type { MapRef } from 'react-map-gl/mapbox'
import { motion, AnimatePresence } from 'framer-motion'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Business } from '@/types'
import { BusinessCard } from '@/components/customer/BusinessCard'

interface MapViewProps {
  businesses: Business[]
  initialLat?: number
  initialLng?: number
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

export function MapView({ businesses, initialLat = 41.8781, initialLng = -87.6298 }: MapViewProps) {
  const mapRef = useRef<MapRef>(null)
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [viewState, setViewState] = useState({
    latitude: initialLat,
    longitude: initialLng,
    zoom: 13,
  })

  const handleMarkerClick = useCallback((business: Business) => {
    setSelectedBusiness(business)
    if (business.lat && business.lng) {
      mapRef.current?.flyTo({
        center: [business.lng, business.lat],
        zoom: 15,
        duration: 800,
      })
    }
  }, [])

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(e: { viewState: typeof viewState }) => setViewState(e.viewState)}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
      >
        <GeolocateControl position="top-right" trackUserLocation />
        <NavigationControl position="top-right" showCompass={false} />

        {businesses.map(biz => (
          biz.lat && biz.lng ? (
            <Marker
              key={biz.id}
              latitude={biz.lat}
              longitude={biz.lng}
              anchor="bottom"
              onClick={(e: { originalEvent: MouseEvent }) => { e.originalEvent.stopPropagation(); handleMarkerClick(biz) }}
            >
              <motion.div
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                className={`cursor-pointer transition-all ${selectedBusiness?.id === biz.id ? 'scale-125' : ''}`}
              >
                <div className="bg-primary text-white rounded-full w-9 h-9 flex items-center justify-center shadow-lg text-xs font-bold border-2 border-white">
                  {biz.name.charAt(0)}
                </div>
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-6 border-transparent border-t-primary mx-auto" />
              </motion.div>
            </Marker>
          ) : null
        ))}
      </Map>

      {/* Business detail bottom sheet */}
      <AnimatePresence>
        {selectedBusiness && (
          <motion.div
            key={selectedBusiness.id}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="absolute bottom-0 left-0 right-0 p-4 pb-6"
          >
            <BusinessCard
              business={selectedBusiness}
              onClose={() => setSelectedBusiness(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
