export default async function handler(req, res) {
  const { TRADEME_CONSUMER_KEY, TRADEME_CONSUMER_SECRET } = process.env;
  
  try {
    const response = await fetch(
      'https://api.trademe.co.nz/v1/Search/Property/Residential.json?region=2&district=15&rows=500',
      {
        headers: {
          'Authorization': `OAuth oauth_consumer_key="${TRADEME_CONSUMER_KEY}"`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
}
