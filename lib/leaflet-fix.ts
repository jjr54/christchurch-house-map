export function fixLeafletIcons() {
  // This function fixes the Leaflet icon issues in Next.js
  // Only run on client side
  if (typeof window !== "undefined") {
    // Leaflet uses these icon paths relative to the CSS file
    // In Next.js, we need to handle this differently
    delete (window as any)._leafletIconMissing
  }
}
