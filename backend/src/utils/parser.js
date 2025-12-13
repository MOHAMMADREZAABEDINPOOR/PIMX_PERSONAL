// Helper to decode Base64 safely
const safeBase64Decode = (str) => {
  try {
    return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
  } catch (e) {
    return '';
  }
};

// Generate a random ID
const genId = () => Math.random().toString(36).substring(2, 9);

export const parseServerConfigs = (content) => {
  const configs = [];
  
  // Clean up content
  let raw = content.trim();
  
  // Check if the whole file is base64 encoded (common for subscriptions)
  if (!raw.includes('://')) {
    const decoded = safeBase64Decode(raw);
    if (decoded) {
      raw = decoded;
    }
  }

  const lines = raw.split(/\s+/); // Split by whitespace/newlines

  lines.forEach(line => {
    line = line.trim();
    if (!line) return;

    if (line.startsWith('vmess://')) {
      try {
        const b64 = line.substring(8);
        const jsonStr = safeBase64Decode(b64);
        if (jsonStr) {
          const data = JSON.parse(jsonStr);
          // فقط سرورهایی که add و port معتبر دارن
          if (data.add && data.add !== 'unknown' && data.port && data.port !== 0) {
            configs.push({
              id: genId(),
              originalString: line,
              protocol: 'vmess',
              transport: data.net || 'tcp',
              ps: data.ps || 'vmess-node',
              add: data.add,
              port: data.port,
              host: data.host || '',
              path: data.path || '',
              tls: data.tls || '',
              scanned: false,
              latency: 9999,
              status: 'pending'
            });
          }
        }
      } catch (e) {
        // failed to parse vmess
      }
    } else if (line.startsWith('vless://')) {
      try {
        const url = new URL(line);
        const params = new URLSearchParams(url.search);
        // فقط سرورهایی که hostname معتبر دارن (port اختیاریه، default 443)
        if (url.hostname && url.hostname !== 'unknown') {
          configs.push({
            id: genId(),
            originalString: line,
            protocol: 'vless',
            transport: params.get('type') || params.get('net') || 'tcp',
            ps: url.hash ? decodeURIComponent(url.hash.substring(1)) : 'vless-node',
            add: url.hostname,
            port: url.port || '443',
            host: params.get('host') || params.get('sni') || '',
            path: params.get('path') || params.get('serviceName') || '',
            tls: params.get('security') || '',
            scanned: false,
            latency: 9999,
            status: 'pending'
          });
        }
      } catch(e) { /* ignore */ }
    } else if (line.startsWith('trojan://')) {
       try {
        const url = new URL(line);
        const params = new URLSearchParams(url.search);
        // فقط سرورهایی که hostname معتبر دارن (port اختیاریه، default 443)
        if (url.hostname && url.hostname !== 'unknown') {
          configs.push({
            id: genId(),
            originalString: line,
            protocol: 'trojan',
            transport: params.get('type') || params.get('net') || 'tcp',
            ps: url.hash ? decodeURIComponent(url.hash.substring(1)) : 'trojan-node',
            add: url.hostname,
            port: url.port || '443',
            host: params.get('host') || params.get('sni') || '',
            path: params.get('path') || '',
            tls: params.get('security') || '',
            scanned: false,
            latency: 9999,
            status: 'pending'
          });
        }
      } catch(e) { /* ignore */ }
    }
  });

  console.log(`🔍 Parser: ${lines.length} خط پردازش شد، ${configs.length} سرور معتبر پیدا شد`);
  return configs;
};