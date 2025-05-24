// pages/test-coordinates.js
// Test page to debug coordinate issues

import { useState, useEffect } from 'react';

export default function TestCoordinates() {
  const [apiData, setApiData] = useState(null);
  const [mockData, setMockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTestData();
  }, []);

  const loadTestData = async () => {
    try {
      // Test API endpoint
      console.log('Testing API endpoint...');
      const apiResponse = await fetch('/api/debug-properties');
      const apiResult = await apiResponse.json();
      
      if (apiResponse.ok) {
        setApiData(apiResult);
        console.log('API Debug Result:', apiResult);
      } else {
        console.error('API Debug Error:', apiResult);
        setError(apiResult.error);
      }

      // Test mock data
      try {
        const mockResponse = await fetch('/data/properties.json');
        if (mockResponse.ok) {
          const mockResult = await mockResponse.json();
          setMockData(mockResult);
          console.log('Mock data loaded:', mockResult.length, 'properties');
        }
      } catch (mockError) {
        console.log('No mock data found or error loading:', mockError.message);
      }

    } catch (err) {
      setError(err.message);
      console.error('Test error:', err);
    } finally {
      setLoading(false);
    }
  };

  const testCoordinateValidation = (properties, source) => {
    if (!properties) return null;

    const coords = properties.map(p => {
      if (source === 'api') {
        return {
          id: p.id || p.ListingId,
          title: p.title || p.Title,
          coordinates: p.coordinates || p.GeographicLocation,
          hasCoords: !!(p.coordinates || p.GeographicLocation)
        };
      } else {
        return {
          id: p.id,
          title: p.title,
          coordinates: p.coordinates,
          hasCoords: !!p.coordinates
        };
      }
    });

    const withCoords = coords.filter(p => p.hasCoords);
    const validCoords = coords.filter(p => {
      if (!p.coordinates) return false;
      const lat = p.coordinates.lat || p.coordinates.Latitude;
      const lng = p.coordinates.lng || p.coordinates.Longitude;
      return lat !== undefined && lng !== undefined && lat !== null && lng !== null;
    });

    return {
      total: coords.length,
      withCoords: withCoords.length,
      validCoords: validCoords.length,
      sample: coords.slice(0, 3)
    };
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Testing Coordinates...</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const apiTest = apiData ? testCoordinateValidation(
    apiData.rawResponse?.List || [], 
    'api'
  ) : null;

  const mockTest = mockData ? testCoordinateValidation(mockData, 'mock') : null;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Coordinate Debug Test</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
          <h2 className="font-semibold text-red-800">Error:</h2>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* API Data Test */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">TradeMe API Data</h2>
        {apiData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>API Response:</strong>
                <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                  <li>Total Count: {apiData.totalCount}</li>
                  <li>List Length: {apiData.listLength}</li>
                  <li>Has Sample: {apiData.sampleProperty ? 'Yes' : 'No'}</li>
                </ul>
              </div>
              <div>
                <strong>Coordinate Analysis:</strong>
                {apiTest && (
                  <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                    <li>Total Properties: {apiTest.total}</li>
                    <li>With Coordinates: {apiTest.withCoords}</li>
                    <li>Valid Coordinates: {apiTest.validCoords}</li>
                  </ul>
                )}
              </div>
            </div>

            {apiData.sampleProperty && (
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-medium mb-2">Sample Property:</h3>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(apiData.sampleProperty, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500">No API data available</p>
        )}
      </div>

      {/* Mock Data Test */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Mock Data</h2>
        {mockTest ? (
          <div className="space-y-4">
            <div>
              <strong>Mock Data Analysis:</strong>
              <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                <li>Total Properties: {mockTest.total}</li>
                <li>With Coordinates: {mockTest.withCoords}</li>
                <li>Valid Coordinates: {mockTest.validCoords}</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-medium mb-2">Sample Mock Properties:</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(mockTest.sample, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No mock data available</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button 
          onClick={loadTestData}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Refresh Test
        </button>
        <button 
          onClick={() => window.open('/api/debug-properties', '_blank')}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          View Raw API Response
        </button>
      </div>
    </div>
  );
}
