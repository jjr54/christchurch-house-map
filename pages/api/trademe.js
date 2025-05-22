import OAuth from 'oauth-1.0a';
import crypto from 'crypto';

// Required by oauth-1.0a for generating HMAC signatures
function hash_function_sha1(base_string, key) {
  return crypto
    .createHmac('sha1', key)
    .update(base_string)
    .digest('base64');
}

export default async function handler(req, res) {
  const oauth = new OAuth({
    consumer: {
      key: process.env.TRADEME_CONSUMER_KEY,
      secret: process.env.TRADEME_CONSUMER_SECRET,
    },
    signature_method: 'HMAC-SHA1',
    hash_function: hash_function_sha1,
  });

  const request_data = {
    url: 'https://api.tmsandbox.co.nz/v1/Search/Property/Residential.json',
    method: 'GET',
  };

  const headers = oauth.toHeader(oauth.authorize(request_data));

  try {
    const response = await fetch(request_data.url, {
      method: 'GET',
      headers: {
        ...headers,
        Accept: 'application/json',
      },
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Trade Me API request failed', details: err.message });
  }
}
