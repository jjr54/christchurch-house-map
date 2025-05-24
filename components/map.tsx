"use client"

import { useEffect, useCallback } from "react"
import {
  MapContainer,
  TileLayer,
  Circle,
  CircleMarker,
  useMap,
  useMapEvents,
} from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { calculateMedianPrice } from "@/lib/utils"
import { fixLeafletIcons } from "@/lib/leaflet-fix"

interface MapProps {
  center: { lat: number; lng: number }
  circlePosition: { lat: number; lng: number }
  setCirclePosition: (pos: { lat: number; lng: number }) => void
  radius: number
  houseData: any
  setMedianPrice: (price: number | null) => void
  isDragging: boolean
  setIsDragging: (dragging: boolean) => void
  kelleherGreen: string
}

export default function Map({
  center,
  circlePosition,
  setCirclePosition,
  radius,
  houseData,
  setMedianPrice,
  isDragging,
  setIsDragging,
  kelleherGreen,
}: MapProps) {
  // Prevent invalid LatLng crash
  if (
    !center?.lat || !center?.lng ||
    !circlePosition?.lat || !circlePosition?.lng
  ) {
    return <p>Loading map data...</p>
  }

  useEffect(() => {
    fixLeafletIcons()
  }, [])

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      style={{ height: "100vh", width: "100%" }}
      zoomControl={false}
      scrollWheelZoom={true}
      className="mt-16"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="opacity-90"
      />

      {/* House markers */}
      {houseData?.features?.map((feature: any) => {
        const coords = feature.geometry?.coordinates
        if (!Array.isArray(coords) || coords.length < 2) return null

        const [lng, lat] = coords
        const price = feature.properties?.price
        const id = feature.properties?.id
        if (!lat || !lng || !price || !id) return null

        let color = "#10B981"
        if (price > 600000) color = "#FBBF24"
        if (price > 900000) color = "#EF4444"

        return (
          <CircleMarker
            key={id}
            center={[lat, lng]}
            radius={4}
            pathOptions={{
              fillColor: color,
              fillOpacity: 0.8,
              color: "#ffffff",
              weight: 1,
            }}
          />
        )
      })}

      {/* Draggable circle */}
      <CustomDraggableCircle
        position={circlePosition}
        setPosition={setCirclePosition}
        radius={radius}
        isDragging={isDragging}
        setIsDragging={setIsDragging}
        kelleherGreen={kelleherGreen}
      />

      <MedianPriceCalculator
        center={circlePosition}
        radius={radius}
        houseData={houseData}
        setMedianPrice={setMedianPrice}
      />
    </MapContainer>
  )
}

function CustomDraggableCircle({
  position,
  setPosition,
  radius,
  isDragging,
  setIsDragging,
  kelleherGreen,
}: {
  position: { lat: number; lng: number }
  setPosition: (pos: { lat: number; lng: number }) => void
  radius: number
  isDragging: boolean
  setIsDragging: (dragging: boolean) => void
  kelleherGreen: string
}) {
  const map = useMap()

  const isInsideCircle = useCallback(
    (point: { lat: number; lng: number }) => {
      const distance = map.distance([position.lat, position.lng], [point.lat, point.lng])
      return distance <= Math.max(30, radius * 0.2)
    },
    [map, position, radius]
  )

  useMapEvents({
    mousedown: (e) => {
      if (isInsideCircle(e.latlng)) {
        setIsDragging(true)
        map.dragging.disable()
        e.originalEvent.preventDefault()
      }
    },
    mousemove: (e) => {
      if (isDragging) {
        setPosition({ lat: e.latlng.lat, lng: e.latlng.lng })
        e.originalEvent.preventDefault()
      }
    },
    mouseup: () => {
      if (isDragging) {
        setIsDragging(false)
        map.dragging.enable()
      }
    },
    touchstart: (e) => {
      if (e.touches.length === 1) {
        const point = e.touches[0].target._latlng
        if (point && isInsideCircle(point)) {
          setIsDragging(true)
          map.dragging.disable()
        }
      }
    },
    touchmove: (e) => {
      if (isDragging && e.touches.length === 1) {
        const point = map.mouseEventToLatLng(e.touches[0])
        setPosition({ lat: point.lat, lng: point.lng })
      }
    },
    touchend: () => {
      if (isDragging) {
        setIsDragging(false)
        map.dragging.enable()
      }
    },
  })

  return (
    <>
      <Circle
        center={[position.lat, position.lng]}
        radius={radius}
        pathOptions={{
          color: "#0A3161",
          fillColor: "#0A3161",
          fillOpacity: 0.1,
          weight: 2,
          opacity: 0.3,
        }}
      />
      <CircleMarker
        center={[position.lat, position.lng]}
        radius={10}
        pathOptions={{
          fillColor: kelleherGreen,
          color: "white",
          weight: 3,
          fillOpacity: 1,
        }}
      />
      <CircleMarker
        center={[position.lat, position.lng]}
        radius={6}
        pathOptions={{
          fillColor: "white",
          color: "white",
          weight: 0,
          fillOpacity: 1,
        }}
      />
    </>
  )
}

function MedianPriceCalculator({
  center,
  radius,
  houseData,
  setMedianPrice,
}: {
  center: { lat: number; lng: number }
  radius: number
  houseData: any
  setMedianPrice: (price: number | null) => void
}) {
  useEffect(() => {
    if (!houseData) return

    const radiusInDegrees = (radius / 1000) * 0.009
    const housesInRadius = houseData.features.filter((feature: any) => {
      const coords = feature.geometry?.coordinates
      if (!Array.isArray(coords) || coords.length < 2) return false

      const [lng, lat] = coords
      const distance = Math.sqrt(
        Math.pow(lng - center.lng, 2) + Math.pow(lat - center.lat, 2)
      )
      return distance <= radiusInDegrees
    })

    const prices = housesInRadius.map((feature: any) => feature.properties?.price)
    const median = calculateMedianPrice(prices)
    setMedianPrice(median)
  }, [center, radius, houseData, setMedianPrice])

  return null
  console.log('Properties received:', properties?.map(p => p.coordinates));
}
