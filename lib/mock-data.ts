// Generate mock house sale data for Christchurch
// In a real implementation, this would be replaced with calls to the homes.co.nz API
export function generateMockHouseData(center: { latitude: number; longitude: number }, count: number) {
  const features = []

  // Price ranges for Christchurch (in NZD)
  const MIN_PRICE = 350000
  const MAX_PRICE = 1200000

  // Generate random points within a larger area around Christchurch
  // Approximately 10km radius (0.09 degrees)
  const RADIUS = 0.09

  for (let i = 0; i < count; i++) {
    // Random angle
    const angle = Math.random() * Math.PI * 2

    // Random distance (with square root to distribute points more evenly)
    const distance = Math.sqrt(Math.random()) * RADIUS

    // Calculate coordinates
    const longitude = center.longitude + distance * Math.cos(angle)
    const latitude = center.latitude + distance * Math.sin(angle)

    // Generate a price with some geographic correlation
    // Houses closer to city center tend to be more expensive
    const distanceFromCenter = Math.sqrt(
      Math.pow(longitude - center.longitude, 2) + Math.pow(latitude - center.latitude, 2),
    )

    // Normalize distance (0 to 1)
    const normalizedDistance = Math.min(distanceFromCenter / RADIUS, 1)

    // Price is inversely related to distance from center, with some randomness
    const priceVariation = Math.random() * 0.4 - 0.2 // -20% to +20%
    const price = Math.round((MAX_PRICE - (MAX_PRICE - MIN_PRICE) * normalizedDistance) * (1 + priceVariation))

    // Add some neighborhood clustering
    // This creates areas with similar pricing
    const neighborhoodFactor = Math.sin(longitude * 100) * Math.cos(latitude * 100)
    const adjustedPrice = Math.max(MIN_PRICE, Math.min(MAX_PRICE, Math.round(price * (1 + neighborhoodFactor * 0.2))))

    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      properties: {
        id: i,
        price: adjustedPrice,
        bedrooms: Math.floor(Math.random() * 4) + 1,
        bathrooms: Math.floor(Math.random() * 3) + 1,
        sqm: Math.floor(Math.random() * 150) + 80,
        saleDate: randomSaleDate(),
        // Additional properties that would come from homes.co.nz API
        address: generateRandomAddress(),
        propertyType: randomPropertyType(),
        yearBuilt: Math.floor(Math.random() * 70) + 1950,
        landSize: Math.floor(Math.random() * 800) + 200,
      },
    })
  }

  return {
    type: "FeatureCollection",
    features,
  }
}

// Generate a random sale date within the last 6 months
function randomSaleDate() {
  const now = new Date()
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(now.getMonth() - 6)

  const randomTimestamp = sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime())

  return new Date(randomTimestamp).toISOString().split("T")[0]
}

// Generate a random Christchurch address
function generateRandomAddress() {
  const streetNumbers = [1, 2, 3, 5, 7, 8, 10, 12, 15, 17, 20, 22, 25, 27, 30, 32, 35, 37, 40, 42, 45, 47, 50]
  const streetNames = [
    "Papanui",
    "Riccarton",
    "Colombo",
    "Bealey",
    "Fendalton",
    "Hagley",
    "Cranford",
    "Brougham",
    "Memorial",
    "Fitzgerald",
    "Moorhouse",
    "Barbadoes",
    "Worcester",
    "Hereford",
    "Cashel",
    "Lichfield",
    "Tuam",
    "St Asaph",
    "Ferry",
    "Madras",
    "Manchester",
    "Durham",
    "Montreal",
  ]
  const streetTypes = ["Road", "Street", "Avenue", "Lane", "Drive", "Place", "Way", "Crescent"]
  const suburbs = [
    "Merivale",
    "Fendalton",
    "Riccarton",
    "Ilam",
    "Papanui",
    "St Albans",
    "Cashmere",
    "Sumner",
    "Redcliffs",
    "Avonhead",
    "Hornby",
    "Halswell",
    "Wigram",
    "Addington",
    "Sydenham",
    "Linwood",
    "New Brighton",
    "Shirley",
    "Mairehau",
    "Bishopdale",
  ]

  const number = streetNumbers[Math.floor(Math.random() * streetNumbers.length)]
  const name = streetNames[Math.floor(Math.random() * streetNames.length)]
  const type = streetTypes[Math.floor(Math.random() * streetTypes.length)]
  const suburb = suburbs[Math.floor(Math.random() * suburbs.length)]

  return `${number} ${name} ${type}, ${suburb}, Christchurch`
}

// Generate a random property type
function randomPropertyType() {
  const types = ["House", "Townhouse", "Apartment", "Unit", "Lifestyle"]
  const weights = [0.6, 0.2, 0.1, 0.05, 0.05] // Weighted probabilities

  const random = Math.random()
  let cumulativeWeight = 0

  for (let i = 0; i < types.length; i++) {
    cumulativeWeight += weights[i]
    if (random < cumulativeWeight) {
      return types[i]
    }
  }

  return types[0] // Default to House
}
