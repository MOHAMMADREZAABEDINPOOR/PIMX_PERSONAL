// Cloudflare Pages Function for /api/servers
export async function onRequestGet(context) {
  const { env } = context;
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  
  try {
    // Mock data for now - you can connect to KV later
    const mockServers = [
      {
        id: 1,
        config: "vless://example1@server1.com:443?encryption=none&security=tls&type=ws&host=server1.com&path=%2F#Server1",
        latency: 45,
        status: "active",
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        config: "vmess://example2@server2.com:80?encryption=auto&security=none&type=tcp#Server2",
        latency: 67,
        status: "active",
        createdAt: new Date().toISOString()
      },
      {
        id: 3,
        config: "vless://example3@server3.com:443?encryption=none&security=tls&type=grpc&serviceName=grpc&host=server3.com#Server3",
        latency: 89,
        status: "active",
        createdAt: new Date().toISOString()
      }
    ];
    
    return new Response(JSON.stringify(mockServers), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}