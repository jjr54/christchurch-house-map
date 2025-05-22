"use client"

import { useEffect, useCallback } from "react"
import { MapContainer, TileLayer, Circle, CircleMarker, useMap, useMapEvents } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { calculateMedianPrice } from "@/lib/utils"

// Fix Leaflet icon issues
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
  // Initialize Leaflet on client-side only
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
      {houseData &&
        houseData.features.map((feature: any) => {
          const [lng, lat] = feature.geometry.coordinates
          const price = feature.properties.price

          // Determine color based on price
          let color = "#10B981" // Green for lower prices
          if (price > 600000) color = "#FBBF24" // Yellow for mid prices
          if (price > 900000) color = "#EF4444" // Red for higher prices

          return (
            <CircleMarker
              key={feature.properties.id}
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

      {/* Custom draggable circle */}
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

// Custom component for draggable circle using map click events
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

  // Function to check if a point is inside the circle
  const isInsideCircle = useCallback(
    (point: { lat: number; lng: number }) => {
      const distance = map.distance([position.lat, position.lng], [point.lat, point.lng])
      // Check if the point is inside the circle or close to the center (for easier grabbing)
      return distance <= Math.max(30, radius * 0.2) // Either 30 meters or 20% of radius, whichever is larger
    },
    [map, position, radius],
  )

  // Use map events to handle dragging
  useMapEvents({
    mousedown: (e) => {
      const point = e.latlng
      if (isInsideCircle(point)) {
        setIsDragging(true)
        // Disable map dragging while we're dragging the circle
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
        // Re-enable map dragging
        map.dragging.enable()
      }
    },
    // Handle touch events for mobile
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
      {/* Circle visualization */}
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
        eventHandlers={{
          click: (e) => {
            // Prevent click from propagating to map
            e.originalEvent.stopPropagation()
          },
        }}
      />

      {/* Center point visualization - white with green background */}
      <CircleMarker
        center={[position.lat, position.lng]}
        radius={10}
        pathOptions={{
          fillColor: isDragging ? kelleherGreen : kelleherGreen,
          color: "white",
          weight: 3,
          fillOpacity: 1,
        }}
        eventHandlers={{
          click: (e) => {
            // Prevent click from propagating to map
            e.originalEvent.stopPropagation()
          },
        }}
      />

      {/* Inner white circle with green background */}
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

// Component to calculate median price based on circle position and radius
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

    // In a real implementation, this would call the homes.co.nz API
    // to get actual property data within the radius

    // Convert radius from meters to degrees (approximate)
    // 1km is approximately 0.009 degrees at Christchurch's latitude
    const radiusInDegrees = (radius / 1000) * 0.009

    const housesInRadius = houseData.features.filter((feature: any) => {
      const [longitude, latitude] = feature.geometry.coordinates
      const distance = Math.sqrt(Math.pow(longitude - center.lng, 2) + Math.pow(latitude - center.lat, 2))
      return distance <= radiusInDegrees
    })

    const prices = housesInRadius.map((feature: any) => feature.properties.price)
    const median = calculateMedianPrice(prices)
    setMedianPrice(median)
  }, [center, radius, houseData, setMedianPrice])

  return null
}
