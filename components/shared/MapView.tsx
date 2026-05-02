'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
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
  const [isFollowing, setIsFollowing] = useState(true)
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)

  const [viewState, setViewState] = useState({
    latitude: initialLat,
    longitude: initialLng,
    zoom: 13,
  })

  const lastPositionRef = useRef({
    latitude: initialLat,
    longitude: initialLng,
  })

  const resetTimerRef = useRef<NodeJS.Timeout | null>(null)
  const hasInteractedRef = useRef(false)

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) return

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords

        // ALWAYS store real position
        lastPositionRef.current = { latitude, longitude }

        // Only move camera if following
        if (isFollowing) {
          setViewState({
            latitude,
            longitude,
            zoom: 15,
          })
        }
      },
      (err) => console.error(err),
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [isFollowing])

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

      {/* YOU ARE HERE DOT (fixed center UI indicator removed because it was misleading) */}

      <Map
        ref={mapRef}
        {...viewState}
        onMove={(e) => {
          setViewState(e.viewState)

          if (!hasInteractedRef.current) {
            hasInteractedRef.current = true
            setIsFollowing(false)
          }

          if (resetTimerRef.current) {
            clearTimeout(resetTimerRef.current)
          }

          resetTimerRef.current = setTimeout(() => {
            setIsFollowing(true)
            hasInteractedRef.current = false

            const { latitude, longitude } = lastPositionRef.current

            mapRef.current?.flyTo({
              center: [longitude, latitude],
              zoom: 15,
              duration: 800,
            })
          }, 15000)
        }}
        mapStyle="mapbox://styles/projecthestia/cmolpoqz6001201s684dlcac2"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" showCompass={false} />

        <Marker
          latitude={lastPositionRef.current.latitude}
          longitude={lastPositionRef.current.longitude}
          anchor="center"
        >
          <div className="w-5 h-5 bg-blue-600 rounded-full border-4 border-white shadow-lg" />
        </Marker>

        {businesses.map(biz => (
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
