// pages/api/debug-properties.js
// Debug endpoint to see raw TradeMe API response

export default async function handler(req, res) {
  const { 
    TRADEME_CONSUMER_KEY, 
    TRADEME_CONSUMER_SECRET 
  } = process.env;

  if (!TRADEME_CONSUMER_KEY || !TRADEME_CONSUMER_SECRET) {
    return res.status(500).json({ 
      error: 'TradeMe API credentials not configured' 
    });
  }

  try {
    const params = new URLSearchParams({
      region: '2',           // Canterbury region
      district: '15',        // Christchurch City
      rows: '10',            // Just 10 for debugging
      page: '1'
    });

    const apiUrl = `https://api.tmsandbox.co.nz/v1/Search/Property/Residential.json?${params}`;
    
    const authHeader = `OAuth oauth_consumer_key="${TRADEME_CONSUMER_KEY}", oauth_signature_method="PLAINTEXT", oauth_signature="${encodeURIComponent(TRADEME_CONSUMER_SECRET)}&"`;

    console.log('Debug API URL:', apiUrl);
    console.log('Debug Auth Header:', authHeader);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'User-Agent': 'ChristchurchHouseMap/1.0'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      return res.status(response.status).json({ 
        error: `TradeMe API error: ${response.status}`,
        details: errorText,
        url: apiUrl
      });
    }

    const data = await response.json();
    
    // Log the full structure for debugging
    console.log('=== RAW API RESPONSE ===');
    console.log('Keys in response:', Object.keys(data));
    console.log('Total count:', data.TotalCount);
    console.log('List length:', data.List?.length);
    
    if (data.List && data.List.length > 0) {
      console.log('=== FIRST PROPERTY STRUCTURE ===');
      const firstProperty = data.List[0];
      console.log('Property keys:', Object.keys(firstProperty));
      console.log('Geographic Location:', firstProperty.GeographicLocation);
      console.log('Has coordinates?', !!firstProperty.GeographicLocation);
      
      if (firstProperty.GeographicLocation) {
        console.log('Latitude:', firstProperty.GeographicLocation.Latitude);
        console.log('Longitude:', firstProperty.GeographicLocation.Longitude);
      }
    }

    // Return debug info
    res.status(200).json({
      success: true,
      totalCount: data.TotalCount,
      listLength: data.List?.length || 0,
      sampleProperty: data.List?.[0] ? {
        id: data.List[0].ListingId,
        title: data.List[0].Title,
        address: data.List[0].Address,
        hasGeoLocation: !!data.List[0].GeographicLocation,
        geoLocation: data.List[0].GeographicLocation,
        allKeys: Object.keys(data.List[0])
      } : null,
      rawResponse: data // Include full response for inspection
    });

  } catch (error) {
    console.error('Debug API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch debug data',
      details: error.message 
    });
  }
}
