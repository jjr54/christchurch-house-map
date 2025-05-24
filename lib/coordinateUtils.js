// lib/coordinateUtils.js
// Utilities for validating and handling coordinates

export function isValidCoordinate(lat, lng) {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat !== 0 &&
    lng !== 0 &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function isValidProperty(property) {
  if (!property || !property.coordinates) {
    return false;
  }
  
  const { lat, lng } = property.coordinates;
  return isValidCoordinate(lat, lng);
}

export function filterValidProperties(properties) {
  return properties.filter(isValidProperty);
}

export function isInChristchurch(lat, lng) {
  // Rough bounding box for Christchurch area
  const christchurchBounds = {
    north: -43.4,
    south: -43.65,
    east: 172.8,
    west: 172.4
  };
  
  return (
    lat >= christchurchBounds.south &&
    lat <= christchurchBounds.north &&
    lng >= christchurchBounds.west &&
    lng <= christchurchBounds.east
  );
}

export function getChristchurchCenter() {
  return {
    lat: -43.5321,
    lng: 172.6362
  };
}

// Debug helper to log coordinate issues
export function debugCoordinates(properties) {
  console.log('=== Coordinate Debug ===');
  console.log(`Total properties: ${properties.length}`);
  
  const withCoords = properties.filter(p => p.coordinates);
  console.log(`Properties with coordinates: ${withCoords.length}`);
  
  const validCoords = properties.filter(isValidProperty);
  console.log(`Properties with valid coordinates: ${validCoords.length}`);
  
  const invalidProperties = properties.filter(p => !isValidProperty(p));
  if (invalidProperties.length > 0) {
    console.log('Invalid properties:', invalidProperties.slice(0, 3));
  }
  
  const inChristchurch = validCoords.filter(p => 
    isInChristchurch(p.coordinates.lat, p.coordinates.lng)
  );
  console.log(`Properties in Christchurch bounds: ${inChristchurch.length}`);
  
  return validCoords;
}
