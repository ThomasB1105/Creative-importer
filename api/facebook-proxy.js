// Vercel Serverless Function - Facebook Graph API Proxy
// Proxies requests to Facebook to bypass CORS restrictions

export const config = {
  api: {
    bodyParser: false, // Handle raw body for FormData
  },
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Accept both GET and POST methods
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the Facebook endpoint from query params
    const { endpoint } = req.query;

    if (!endpoint) {
      return res.status(400).json({ error: 'Missing endpoint parameter' });
    }

    // Decode the endpoint
    const facebookUrl = decodeURIComponent(endpoint);

    // Validate it's a Facebook Graph API URL
    if (!facebookUrl.startsWith('https://graph.facebook.com/')) {
      return res.status(400).json({ error: 'Invalid endpoint - must be Facebook Graph API' });
    }

    let response;

    if (req.method === 'GET') {
      // For GET requests, simply forward to Facebook
      response = await fetch(facebookUrl, {
        method: 'GET',
      });
    } else {
      // For POST requests, collect and forward the body
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const body = Buffer.concat(chunks);

      response = await fetch(facebookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': req.headers['content-type'],
        },
        body: body,
      });
    }

    // Get response data
    const data = await response.json();

    // Return the response
    return res.status(response.status).json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({
      error: 'Proxy error',
      message: error.message
    });
  }
}
