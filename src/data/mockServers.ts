export const mockServers = [
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
  // Add more mock servers...
];

export const mockStats = {
  totalServers: 150,
  activeServers: 142,
  lastScan: new Date().toISOString(),
  nextScan: new Date(Date.now() + 3600000).toISOString()
};