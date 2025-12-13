// Cloudflare Worker to handle API requests
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Handle API routes
    if (url.pathname.startsWith('/api/')) {
      return handleAPI(request, env);
    }
    
    // Serve static files for other routes
    return env.ASSETS.fetch(request);
  }
};

async function handleAPI(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    if (path === '/api/servers') {
      // Get servers from KV storage
      const servers = await env.SERVERS_KV.get('active_servers', 'json') || [];
      return new Response(JSON.stringify(servers), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (path === '/api/stats') {
      const servers = await env.SERVERS_KV.get('active_servers', 'json') || [];
      const stats = {
        totalServers: servers.length,
        activeServers: servers.filter(s => s.status === 'active').length,
        lastScan: await env.SERVERS_KV.get('last_scan') || new Date().toISOString(),
        nextScan: new Date(Date.now() + 3600000).toISOString()
      };
      
      return new Response(JSON.stringify(stats), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (path.startsWith('/api/servers/') && path.endsWith('/dislike')) {
      const serverId = path.split('/')[3];
      const dislikes = await env.SERVERS_KV.get('dislikes', 'json') || {};
      dislikes[serverId] = (dislikes[serverId] || 0) + 1;
      await env.SERVERS_KV.put('dislikes', JSON.stringify(dislikes));
      
      return new Response(JSON.stringify({ success: true, dislikes: dislikes[serverId] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Not Found', { status: 404, headers: corsHeaders });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}