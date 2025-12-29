const DEFAULT_BACKEND = 'https://pimx-backend.onrender.com/api';
const FUNCTION_PREFIX = '/.netlify/functions/api';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const getBackendBase = () => {
  return process.env.BACKEND_URL || DEFAULT_BACKEND;
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: '',
    };
  }

  const backendBase = getBackendBase().replace(/\/+$/, '');
  const path = event.path.startsWith(FUNCTION_PREFIX)
    ? event.path.slice(FUNCTION_PREFIX.length)
    : event.path;
  const query = event.rawQueryString ? `?${event.rawQueryString}` : '';
  const url = `${backendBase}${path}${query}`;

  try {
    const response = await fetch(url, {
      method: event.httpMethod,
      headers: {
        'Content-Type': event.headers['content-type'] || 'application/json',
      },
      body: event.body ? event.body : undefined,
    });

    const body = await response.text();
    const contentType = response.headers.get('content-type') || 'application/json';

    return {
      statusCode: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
      },
      body,
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: error.message || 'Proxy failed' }),
    };
  }
};
