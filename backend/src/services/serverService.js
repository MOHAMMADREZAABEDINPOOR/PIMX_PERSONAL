import { getDatabase } from '../database.js';

export const getActiveServers = async () => {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        id,
        config_string,
        protocol,
        transport,
        tls,
        name,
        address,
        port,
        host,
        path,
        country,
        latency,
        status,
        operators,
        packet_loss,
        speed,
        quality_score,
        real_test_results,
        reachable,
        scanned,
        dislikes,
        created_at,
        updated_at
      FROM servers 
      WHERE is_selected = 1 AND status = 'active' AND latency < 250 AND scanned = 1 AND reachable = 1
      ORDER BY quality_score DESC, latency ASC, updated_at DESC
      LIMIT 150
    `, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        // Parse operators JSON
        const servers = rows.map(row => ({
          ...row,
          operators: JSON.parse(row.operators || '{}')
        }));
        resolve(servers);
      }
    });
  });
};

export const getAllServers = async () => {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        id,
        config_string,
        protocol,
        transport,
        tls,
        name,
        address,
        port,
        host,
        path,
        country,
        latency,
        status,
        operators,
        packet_loss,
        speed,
        quality_score,
        real_test_results,
        reachable,
        scanned,
        dislikes,
        created_at,
        updated_at
      FROM servers 
      ORDER BY quality_score DESC, updated_at DESC
    `, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        // Parse operators JSON
        const servers = rows.map(row => ({
          ...row,
          operators: JSON.parse(row.operators || '{}')
        }));
        resolve(servers);
      }
    });
  });
};

export const getStats = async () => {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM stats WHERE id = 1', (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row || {
          total_scanned: 0,
          total_active: 0,
          total_selected: 0,
          total_dislikes: 0,
          last_scan: null
        });
      }
    });
  });
};

export const updateServerStats = async (serverId, action, data = {}) => {
  const db = getDatabase();
  
  if (action === 'dislike') {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE servers SET dislikes = dislikes + 1 WHERE id = ?',
        [serverId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            // به‌روزرسانی آمار کلی
            db.run(
              'UPDATE stats SET total_dislikes = (SELECT SUM(dislikes) FROM servers) WHERE id = 1'
            );
            resolve({ changes: this.changes });
          }
        }
      );
    });
  } else if (action === 'real_test_update') {
    return new Promise((resolve, reject) => {
      db.run(`
        UPDATE servers SET 
          latency = ?,
          packet_loss = ?,
          speed = ?,
          quality_score = ?,
          real_test_results = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        data.latency || 999,
        data.packet_loss || 0,
        data.speed || 0,
        data.quality_score || 0,
        data.real_test_results || '{}',
        serverId
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }
};

export const getSources = async () => {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM sources ORDER BY id', (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

export const addSource = async (url, name) => {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO sources (url, name) VALUES (?, ?)',
      [url, name],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      }
    );
  });
};

export const toggleSource = async (sourceId, active) => {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE sources SET active = ? WHERE id = ?',
      [active ? 1 : 0, sourceId],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      }
    );
  });
};