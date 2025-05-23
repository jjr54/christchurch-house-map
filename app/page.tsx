"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { Slider } from "@/components/ui/slider"
import { Card } from "@/components/ui/card"
import Image from "next/image"

// Christchurch coordinates
const CHRISTCHURCH_CENTER = {
  lat: -43.5321,
  lng: 172.6362,
}

// Default radius in meters
const DEFAULT_RADIUS = 1000

// Kelleher brand colors
const KELLEHER_BLUE = "#0A3161"
const KELLEHER_GREEN = "#1FAC79"

// Dynamically import the Map component with no SSR
// This prevents the "window is not defined" error during server-side rendering
const MapWithNoSSR = dynamic(() => import("@/components/map"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-screen bg-white">
      <div className="bg-kelleher-green p-6 rounded-lg">
        <Image src="/images/kelleherlogo1.svg" alt="Kelleher Logo" width={200} height={80} className="mb-4" />
      </div>
      <div className="w-16 h-16 border-4 border-kelleher-blue border-t-transparent rounded-full animate-spin mt-8"></div>
      <p className="mt-4 text-kelleher-blue">Loading map...</p>
    </div>
  ),
})

export default function HousePriceMap() {
  const [houseData, setHouseData] = useState<any>(null)
  const [medianPrice, setMedianPrice] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [circlePosition, setCirclePosition] = useState(CHRISTCHURCH_CENTER)
  const [radius, setRadius] = useState(DEFAULT_RADIUS)
  const [isDragging, setIsDragging] = useState(false)

  // Generate mock data on component mount
   useEffect(() => {
    // Fetch data from Trade Me API
    const fetchData = async () => {
      try {
        const response = await fetch('/api/trademe')
        const trademeData = await response.json()

        // Transform trademeData into GeoJSON FeatureCollection format expected by the map
        const features = (trademeData.List || []).map((item: any, i: number) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [item.Longitude, item.Latitude],
          },
          properties: {
            id: item.ListingId || i,
            price: item.PriceDisplay ? parseInt(item.PriceDisplay.replace(/[^0-9]/g, "")) : 0,
            bedrooms: item.Bedrooms,
            bathrooms: item.Bathrooms,
            address: item.Address,
            // add more fields as needed
          },
        }))

        setHouseData({
          type: "FeatureCollection",
          features,
        })
        setLoading(false)
      } catch (error) {
        console.error("Error fetching house data from Trade Me API:", error)
        setLoading(false)
      }
    }

    fetchData()
  }, [])
  // Handle radius change from slider
  const handleRadiusChange = (value: number[]) => {
    setRadius(value[0])
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white">
        <div className="bg-kelleher-green p-6 rounded-lg">
          <Image src="/images/kelleherlogo1.svg" alt="Kelleher Logo" width={200} height={80} className="mb-4" />
        </div>
        <div className="w-16 h-16 border-4 border-kelleher-blue border-t-transparent rounded-full animate-spin mt-8"></div>
        <p className="mt-4 text-kelleher-blue">Loading property data...</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-white shadow-md z-[2000] flex justify-between items-center px-4 py-2">
        <div className="flex items-center">
          <div className="bg-kelleher-green p-2 rounded">
            <Image src="/images/kelleherlogo1.svg" alt="Kelleher Logo" width={150} height={60} className="mr-4" />
          </div>
          <h1 className="text-xl font-semibold text-kelleher-blue hidden md:block ml-4">Property Price Explorer</h1>
        </div>
        <div className="text-sm text-gray-600">
          Powered by <span className="font-semibold">homes.co.nz</span> data
        </div>
      </div>

      {/* Map Component */}
      <MapWithNoSSR
        center={CHRISTCHURCH_CENTER}
        circlePosition={circlePosition}
        setCirclePosition={setCirclePosition}
        radius={radius}
        houseData={houseData}
        setMedianPrice={setMedianPrice}
        isDragging={isDragging}
        setIsDragging={setIsDragging}
        kelleherGreen={KELLEHER_GREEN}
      />

      {/* Median price display */}
      <Card className="absolute top-24 left-4 p-4 bg-white shadow-lg border-0 w-64 z-[1000]">
        <h2 className="text-sm font-medium text-gray-500 mb-1">Median House Price</h2>
        <p className="text-3xl font-bold text-kelleher-blue">
          {medianPrice ? `$${medianPrice.toLocaleString()}` : "No data"}
        </p>
        <p className="text-xs text-gray-500 mt-1">Within {(radius / 1000).toFixed(1)}km radius of selected point</p>
      </Card>

      {/* Radius slider */}
      <Card className="absolute bottom-4 left-1/2 transform -translate-x-1/2 p-4 bg-white shadow-lg border-0 w-80 z-[1000]">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Radius</span>
            <span className="text-sm font-medium text-kelleher-blue">{(radius / 1000).toFixed(1)}km</span>
          </div>
          <Slider
            defaultValue={[DEFAULT_RADIUS]}
            min={500}
            max={5000}
            step={100}
            onValueChange={handleRadiusChange}
            className="kelleher-slider"
          />
        </div>
      </Card>

      <div className="absolute bottom-20 left-4 text-xs text-gray-600 bg-white/90 p-2 rounded shadow-sm z-[1000]">
        <p>Drag the center point of the circle • Adjust radius with the slider</p>
      </div>

      {/* Kelleher branding footer */}
      <div className="absolute bottom-4 right-4 text-xs bg-kelleher-green text-white p-2 rounded shadow-sm z-[1000]">
        <p>© {new Date().getFullYear()} Kelleher Real Estate</p>
      </div>
    </div>
  )
}
