// lib/dataService.js
// Service to handle property data from either API or mock data

import { filterValidProperties, debugCoordinates } from './coordinateUtils';

export class PropertyDataService {
  constructor() {
    this.cache = null;
    this.cacheTimestamp = null;
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  }

  async getProperties(options = {}) {
    const { 
      useApi = true, 
      forceRefresh = false,
      priceMin,
      priceMax,
      bedrooms,
      propertyType 
    } = options;

    // Check cache first
    if (!forceRefresh && this.cache && this.isValidCache()) {
      console.log('Using cached property data');
      return this.filterProperties(this.cache, { priceMin, priceMax, bedrooms, propertyType });
    }

    try {
      let properties;
      
      if (useApi) {
        console.log('Fetching live data from TradeMe API...');
        properties = await this.fetchFromApi();
      } else {
        console.log('Using mock data...');
        properties = await this.fetchMockData();
      }

      // Cache the results and filter for valid coordinates
      const validProperties = filterValidProperties(properties);
      console.log(`Filtered ${properties.length} → ${validProperties.length} valid properties`);
      
      this.cache = validProperties;
      this.cacheTimestamp = Date.now();

      return this.filterProperties(validProperties, { priceMin, priceMax, bedrooms, propertyType });
      
    } catch (error) {
      console.error('Error fetching properties:', error);
      
      // Fallback to mock data if API fails
      if (useApi) {
        console.log('API failed, falling back to mock data...');
        try {
          const mockProperties = await this.fetchMockData();
          return this.filterProperties(mockProperties, { priceMin, priceMax, bedrooms, propertyType });
        } catch (mockError) {
          console.error('Mock data also failed:', mockError);
          throw new Error('Failed to load property data from both API and mock sources');
        }
      }
      
      throw error;
    }
  }

  async fetchFromApi() {
    const response = await fetch('/api/properties');
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API request failed: ${response.status} - ${errorData.error || response.statusText}`);
    }
    
    const data = await response.json();
    return data.properties || [];
  }

  async fetchMockData() {
    // Import your existing mock data
    const mockData = await import('../data/properties.json');
    return mockData.default || mockData;
  }

  filterProperties(properties, filters) {
    let filtered = [...properties];

    if (filters.priceMin) {
      filtered = filtered.filter(p => p.priceValue >= filters.priceMin);
    }

    if (filters.priceMax) {
      filtered = filtered.filter(p => p.priceValue <= filters.priceMax);
    }

    if (filters.bedrooms) {
      filtered = filtered.filter(p => p.bedrooms >= filters.bedrooms);
    }

    if (filters.propertyType && filters.propertyType !== 'all') {
      filtered = filtered.filter(p => 
        p.propertyType?.toLowerCase().includes(filters.propertyType.toLowerCase())
      );
    }

    return filtered;
  }

  isValidCache() {
    if (!this.cacheTimestamp) return false;
    return (Date.now() - this.cacheTimestamp) < this.CACHE_DURATION;
  }

  clearCache() {
    this.cache = null;
    this.cacheTimestamp = null;
  }

  // Get property statistics
  getPropertyStats(properties) {
    if (!properties.length) return null;

    const prices = properties
      .filter(p => p.priceValue > 0)
      .map(p => p.priceValue)
      .sort((a, b) => a - b);

    const bedrooms = properties.map(p => p.bedrooms).filter(b => b > 0);
    
    return {
      totalCount: properties.length,
      priceStats: prices.length > 0 ? {
        min: Math.min(...prices),
        max: Math.max(...prices),
        median: prices[Math.floor(prices.length / 2)],
        average: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
      } : null,
      bedroomStats: bedrooms.length > 0 ? {
        min: Math.min(...bedrooms),
        max: Math.max(...bedrooms),
        average: Math.round(bedrooms.reduce((a, b) => a + b, 0) / bedrooms.length * 10) / 10
      } : null,
      suburbs: [...new Set(properties.map(p => p.suburb).filter(Boolean))].sort(),
      propertyTypes: [...new Set(properties.map(p => p.propertyType).filter(Boolean))].sort()
    };
  }
}

// Export singleton instance
export const propertyDataService = new PropertyDataService();
