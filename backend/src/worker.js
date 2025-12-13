// Cloudflare Worker version of the backend
// Simple router without external dependencies

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Simple request handler
async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Get servers endpoint
  if (path === '/api/servers' && request.method === 'GET') {
    try {
      // Get servers from KV storage
      const serversData = await env.SERVERS_KV.get('active_servers');
      const servers = serversData ? JSON.parse(serversData) : [];
      
      return new Response(JSON.stringify(servers.slice(0, 150)), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
  
  // Get stats endpoint
  if (path === '/api/stats' && request.method === 'GET') {
    try {
      const serversData = await env.SERVERS_KV.get('active_servers');
      const servers = serversData ? JSON.parse(serversData) : [];
      const lastScan = await env.SERVERS_KV.get('last_scan') || new Date().toISOString();
      
      return new Response(JSON.stringify({
        totalServers: servers.length,
        activeServers: servers.filter(s => s && s.status === 'active').length,
        lastScan: lastScan,
        nextScan: new Date(Date.now() + 3600000).toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
  
  // Dislike server endpoint
  if (path.includes('/api/servers/') && path.endsWith('/dislike') && request.method === 'POST') {
    try {
      const pathParts = path.split('/');
      const id = pathParts[3];
      
      // Get current dislikes
      const dislikesData = await env.SERVERS_KV.get('server_dislikes');
      const dislikes = dislikesData ? JSON.parse(dislikesData) : {};
      
      dislikes[id] = (dislikes[id] || 0) + 1;
      await env.SERVERS_KV.put('server_dislikes', JSON.stringify(dislikes));
      
      return new Response(JSON.stringify({
        success: true,
        dislikes: dislikes[id]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
  
  // Health check
  if (path === '/api/health' && request.method === 'GET') {
    return new Response(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  // Default response
  return new Response('Not Found', { 
    status: 404, 
    headers: corsHeaders 
  });
}

// Handle all requests
export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  },

  // Scheduled event for scanning (runs every hour)
  async scheduled(event, env, ctx) {
    ctx.waitUntil(performServerScan(env));
  }
};

// Server scanning function
async function performServerScan(env) {
  try {
    console.log('Starting scheduled server scan...');
    
    // Your scanning logic here
    // This is a simplified version - you'll need to adapt your scanner.js logic
    const sources = [
      'https://raw.githubusercontent.com/barry-far/V2ray-Configs/main/Splitted-By-Protocol/vmess.txt',
      'https://raw.githubusercontent.com/barry-far/V2ray-Configs/main/Splitted-By-Protocol/vless.txt',
      // Add more sources
    ];
    
    const allServers = [];
    
    for (const source of sources) {
      try {
        const response = await fetch(source);
        const text = await response.text();
        const configs = text.split('\n').filter(line => line.trim());
        
        for (const config of configs) {
          if (config.startsWith('vmess://') || config.startsWith('vless://')) {
            allServers.push({
              id: Date.now() + Math.random(),
              config: config.trim(),
              status: 'active',
              latency: Math.floor(Math.random() * 200) + 50, // Simulated latency
              createdAt: new Date().toISOString()
            });
          }
        }
      } catch (error) {
        console.error('Error fetching from source:', source, error);
      }
    }
    
    // Store servers in KV
    await env.SERVERS_DB.put('active_servers', JSON.stringify(allServers.slice(0, 150)));
    await env.SERVERS_DB.put('last_scan', new Date().toISOString());
    
    console.log(`Scan completed. Found ${allServers.length} servers.`);
  } catch (error) {
    console.error('Error in scheduled scan:', error);
  }
}