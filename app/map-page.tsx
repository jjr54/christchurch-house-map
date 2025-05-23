// app/map-page.tsx
"use client"

import { useState, useEffect } from "react"
import Map from "@/components/Map" // Import your Map component
import { getHouseData } from "@/lib/api" // API function to fetch house data

export default function MapPage() {
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null)
  const [circlePosition, setCirclePosition] = useState<{ lat: number; lng: number } | null>(null)
  const [radius, setRadius] = useState(500) // Default radius (in meters)
  const [houseData, setHouseData] = useState<any>(null)
  const [medianPrice, setMedianPrice] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [kelleherGreen] = useState("#1FAC79") // Define your green color

  useEffect(() => {
    // Fetching initial location (could be user location or fixed location)
    const fetchLocation = async () => {
      // For example, we can use a fixed location here or fetch from API
      const location = { lat: -43.5321, lng: 172.6362 } // Christchurch coordinates
      setCenter(location)
      setCirclePosition(location)
    }
    fetchLocation()

    // Fetch house data from an API (replace with your actual API call)
    const fetchHouseData = async () => {
      const data = await getHouseData() // Example: getHouseData returns house data
      setHouseData(data)
    }
    fetchHouseData()
  }, [])

  // Handle loading state if the coordinates are not yet available
  if (!center || !circlePosition || !houseData) {
    return <p>Loading map data...</p>
  }

  return (
    <div>
      <h1>Map with Property Data</h1>
      <Map
        center={center}
        circlePosition={circlePosition}
        setCirclePosition={setCirclePosition}
        radius={radius}
        houseData={houseData}
        setMedianPrice={setMedianPrice}
        isDragging={isDragging}
        setIsDragging={setIsDragging}
        kelleherGreen={kelleherGreen}
      />
      {medianPrice !== null && (
        <div>
          <h2>Median Price within Radius: ${medianPrice.toLocaleString()}</h2>
        </div>
      )}
    </div>
  )
}
