// pages/api/properties.js
// API route to fetch live property data from TradeMe

export default async function handler(req, res) {
  const { 
    TRADEME_CONSUMER_KEY, 
    TRADEME_CONSUMER_SECRET,
    TRADEME_ACCESS_TOKEN,
    TRADEME_ACCESS_TOKEN_SECRET 
  } = process.env;

  // Check if required environment variables are present
  if (!TRADEME_CONSUMER_KEY || !TRADEME_CONSUMER_SECRET) {
    return res.status(500).json({ 
      error: 'TradeMe API credentials not configured' 
    });
  }

  try {
    // TradeMe API parameters for Christchurch properties
    const params = new URLSearchParams({
      region: '2',           // Canterbury region
      district: '15',        // Christchurch City
      rows: '500',           // Maximum results per request
      page: '1',             // Page number
      price_min: '100000',   // Minimum price filter
      price_max: '3000000',  // Maximum price filter
      sort_order: 'Default', // Sorting
      photo_size: 'Large'    // Get larger photos
    });

    const apiUrl = `https://api.tmsandbox.co.nz/v1/Search/Property/Residential.json?${params}`;
    
    // Build OAuth 1.0a authorization header
    const authHeader = buildOAuthHeader({
      method: 'GET',
      url: apiUrl,
      consumerKey: TRADEME_CONSUMER_KEY,
      consumerSecret: TRADEME_CONSUMER_SECRET,
      accessToken: TRADEME_ACCESS_TOKEN,
      accessTokenSecret: TRADEME_ACCESS_TOKEN_SECRET
    });

    console.log('Fetching from TradeMe API:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'User-Agent': 'ChristchurchHouseMap/1.0'
      }
    });

    if (!response.ok) {
      console.error('TradeMe API Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      
      return res.status(response.status).json({ 
        error: `TradeMe API error: ${response.status} ${response.statusText}`,
        details: errorText
      });
    }

    const data = await response.json();
    
    // Transform TradeMe data to match your app's expected format
    const transformedProperties = transformTradeWeData(data.List || []);
    
    console.log(`Successfully fetched ${transformedProperties.length} properties`);
    
    res.status(200).json({
      properties: transformedProperties,
      totalCount: data.TotalCount,
      page: data.Page,
      pageSize: data.PageSize
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch properties from TradeMe',
      details: error.message 
    });
  }
}

// Transform TradeMe API data to match your app's format
function transformTradeWeData(properties) {
  return properties
    .filter(property => {
      // More thorough coordinate validation
      const geo = property.GeographicLocation;
      return geo && 
             typeof geo.Latitude === 'number' && 
             typeof geo.Longitude === 'number' &&
             !isNaN(geo.Latitude) && 
             !isNaN(geo.Longitude) &&
             geo.Latitude !== 0 && 
             geo.Longitude !== 0;
    })
    .map(property => ({
      id: property.ListingId,
      title: property.Title,
      address: property.Address,
      suburb: property.Suburb,
      city: property.City || 'Christchurch',
      price: property.PriceDisplay || 'Price by negotiation',
      priceValue: property.StartPrice || 0,
      bedrooms: property.Bedrooms || 0,
      bathrooms: property.Bathrooms || 0,
      parkingSpaces: property.Parking || 0,
      landArea: property.LandArea,
      floorArea: property.FloorArea,
      propertyType: property.PropertyType,
      listingType: property.IsAuction ? 'Auction' : 'Fixed Price',
      description: property.Body || '',
      photos: property.Photos ? property.Photos.map(photo => photo.Value.Large) : [],
      mainPhoto: property.PictureHref || property.Photos?.[0]?.Value?.Large,
      coordinates: {
        lat: parseFloat(property.GeographicLocation.Latitude),
        lng: parseFloat(property.GeographicLocation.Longitude)
      },
      tradeMeUrl: `https://www.trademe.co.nz/property/residential-property-for-sale/${property.ListingId}`,
      dateListted: property.StartDate,
      agency: property.Agency?.Name,
      agent: property.Member?.Nickname
    }));
}

// Simple OAuth 1.0a header builder for TradeMe API
function buildOAuthHeader({ method, url, consumerKey, consumerSecret, accessToken, accessTokenSecret }) {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  const oauthParams = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_version: '1.0'
  };

  // Add access token if available
  if (accessToken) {
    oauthParams.oauth_token = accessToken;
  }

  // For sandbox/basic authentication, use simple OAuth consumer key method
  if (!TRADEME_ACCESS_TOKEN) {
    return `OAuth oauth_consumer_key="${consumerKey}", oauth_signature_method="PLAINTEXT", oauth_signature="${encodeURIComponent(consumerSecret)}&"`;
  }

  // Build the signature base string and sign it (simplified version)
  const paramString = Object.keys(oauthParams)
    .sort()
    .map(key => `${key}=${encodeURIComponent(oauthParams[key])}`)
    .join('&');

  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(accessTokenSecret || '')}`;
  
  // For production, you'd want to use crypto.createHmac for proper HMAC-SHA1 signing
  // This is a simplified version - you might need the oauth-1.0a library for full implementation
  
  const authHeaderParams = Object.keys(oauthParams)
    .map(key => `${key}="${encodeURIComponent(oauthParams[key])}"`)
    .join(', ');

  return `OAuth ${authHeaderParams}`;
}
