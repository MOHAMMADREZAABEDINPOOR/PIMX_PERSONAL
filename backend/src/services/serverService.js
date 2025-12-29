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
          dislikes_since_scan: 0,
          last_scan: null
        });
      }
    });
  });
};

export const recordDislike = async (serverId, userKey) => {
  const db = getDatabase();

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(
        'INSERT OR IGNORE INTO server_dislikes (server_id, user_key) VALUES (?, ?)',
        [serverId, userKey],
        function(err) {
          if (err) {
            reject(err);
            return;
          }

          if (this.changes === 0) {
            db.get(
              'SELECT dislikes_since_scan FROM stats WHERE id = 1',
              (statsErr, row) => {
                if (statsErr) reject(statsErr);
                else resolve({ added: false, dislikesSinceScan: row?.dislikes_since_scan || 0 });
              }
            );
            return;
          }

          db.run(
            'UPDATE servers SET dislikes = dislikes + 1 WHERE id = ?',
            [serverId],
            (serverErr) => {
              if (serverErr) {
                reject(serverErr);
                return;
              }

              db.run(
                `UPDATE stats
                 SET total_dislikes = total_dislikes + 1,
                     dislikes_since_scan = dislikes_since_scan + 1,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = 1`,
                [],
                (statsErr) => {
                  if (statsErr) {
                    reject(statsErr);
                    return;
                  }

                  db.get(
                    'SELECT dislikes_since_scan FROM stats WHERE id = 1',
                    (fetchErr, row) => {
                      if (fetchErr) reject(fetchErr);
                      else resolve({ added: true, dislikesSinceScan: row?.dislikes_since_scan || 0 });
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  });
};

export const removeDislike = async (serverId, userKey) => {
  const db = getDatabase();

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(
        'DELETE FROM server_dislikes WHERE server_id = ? AND user_key = ?',
        [serverId, userKey],
        function(err) {
          if (err) {
            reject(err);
            return;
          }

          if (this.changes === 0) {
            db.get(
              'SELECT dislikes_since_scan FROM stats WHERE id = 1',
              (statsErr, row) => {
                if (statsErr) reject(statsErr);
                else resolve({ removed: false, dislikesSinceScan: row?.dislikes_since_scan || 0 });
              }
            );
            return;
          }

          db.run(
            'UPDATE servers SET dislikes = MAX(dislikes - 1, 0) WHERE id = ?',
            [serverId],
            (serverErr) => {
              if (serverErr) {
                reject(serverErr);
                return;
              }

              db.run(
                `UPDATE stats
                 SET total_dislikes = MAX(total_dislikes - 1, 0),
                     dislikes_since_scan = MAX(dislikes_since_scan - 1, 0),
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = 1`,
                [],
                (statsErr) => {
                  if (statsErr) {
                    reject(statsErr);
                    return;
                  }

                  db.get(
                    'SELECT dislikes_since_scan FROM stats WHERE id = 1',
                    (fetchErr, row) => {
                      if (fetchErr) reject(fetchErr);
                      else resolve({ removed: true, dislikesSinceScan: row?.dislikes_since_scan || 0 });
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  });
};

export const updateServerStats = async (serverId, action, data = {}) => {
  const db = getDatabase();

  if (action === 'real_test_update') {
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
