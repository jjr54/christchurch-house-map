// components/SafeMapComponent.js
// Example of how to safely handle coordinates in your map component

import { useState, useEffect } from 'react';
import { isValidProperty, getChristchurchCenter } from '../lib/coordinateUtils';

export default function SafeMapComponent({ properties }) {
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    if (!properties || properties.length === 0) {
      console.log('No properties to display');
      return;
    }

    // Filter for valid properties before creating markers
    const validProperties = properties.filter(isValidProperty);
    console.log(`Creating markers for ${validProperties.length} valid properties`);

    // Clear existing markers
    markers.forEach(marker => {
      if (marker.setMap) marker.setMap(null);
    });

    if (!map) return;

    // Create new markers only for valid coordinates
    const newMarkers = validProperties.map(property => {
      const { lat, lng } = property.coordinates;
      
      // Double-check coordinates before creating marker
      if (!isValidCoordinate(lat, lng)) {
        console.warn('Skipping invalid coordinates:', lat, lng, property.title);
        return null;
      }

      try {
        // Your map library marker creation here
        // Example for Google Maps:
        return new google.maps.Marker({
          position: { lat, lng },
          map: map,
          title: property.title,
          // ... other marker options
        });
      } catch (error) {
        console.error('Error creating marker:', error, property);
        return null;
      }
    }).filter(Boolean); // Remove null markers

    setMarkers(newMarkers);
    console.log(`Created ${newMarkers.length} markers`);

  }, [properties, map]);

  const initializeMap = () => {
    // Initialize your map here
    const center = getChristchurchCenter();
    
    // Example for Google Maps:
    const mapInstance = new google.maps.Map(document.getElementById('map'), {
      center: center,
      zoom: 12,
    });
    
    setMap(mapInstance);
  };

  useEffect(() => {
    // Initialize map when component mounts
    if (typeof google !== 'undefined') {
      initializeMap();
    } else {
      // Wait for Google Maps to load
      window.initMap = initializeMap;
    }
  }, []);

  return (
    <div className="w-full h-full">
      <div id="map" className="w-full h-full min-h-[400px]">
        {/* Map will render here */}
      </div>
      
      {/* Debug info */}
      <div className="mt-2 text-sm text-gray-600">
        Showing {markers.length} properties on map
        {properties && properties.length !== markers.length && (
          <span className="text-orange-600 ml-2">
            ({properties.length - markers.length} properties filtered out due to invalid coordinates)
          </span>
        )}
      </div>
    </div>
  );
}

// Helper function (you can also import this from coordinateUtils)
function isValidCoordinate(lat, lng) {
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
