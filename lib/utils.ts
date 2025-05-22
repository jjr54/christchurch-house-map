import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Calculate the median value from an array of numbers
export function calculateMedianPrice(prices: number[]): number {
  if (!prices.length) return 0

  // Sort the prices
  const sortedPrices = [...prices].sort((a, b) => a - b)

  // Find the middle value
  const middle = Math.floor(sortedPrices.length / 2)

  // If even number of prices, average the two middle values
  if (sortedPrices.length % 2 === 0) {
    return Math.round((sortedPrices[middle - 1] + sortedPrices[middle]) / 2)
  }

  // If odd number of prices, return the middle value
  return sortedPrices[middle]
}

// This would be where we'd implement the homes.co.nz API integration
export async function fetchHomesCoNzData(lat: number, lng: number, radiusKm: number) {
  // In a real implementation, this would make API calls to homes.co.nz
  // For now, we'll just return a placeholder message
  console.log(`Would fetch data from homes.co.nz API for coordinates: ${lat}, ${lng} with radius ${radiusKm}km`)
  return null
}
