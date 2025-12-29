import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../data/servers.db');

let db;

export const initDatabase = async () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('خطا در اتصال به دیتابیس:', err);
        reject(err);
        return;
      }
      
      console.log('✅ اتصال به دیتابیس برقرار شد');
      
      // ایجاد جداول
      db.serialize(() => {
        // فعال کردن foreign keys
        db.run('PRAGMA foreign_keys = ON');
        
        console.log('📋 ایجاد جداول...');
        // جدول منابع سرور
        db.run(`
          CREATE TABLE IF NOT EXISTS sources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            active BOOLEAN DEFAULT 1,
            last_scan DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        // جدول سرورها
        db.run(`
          CREATE TABLE IF NOT EXISTS servers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            config_string TEXT UNIQUE NOT NULL,
            protocol TEXT NOT NULL,
            transport TEXT,
            tls TEXT,
            name TEXT NOT NULL,
            address TEXT NOT NULL,
            port INTEGER NOT NULL,
            host TEXT,
            path TEXT,
            country TEXT,
            latency INTEGER,
            status TEXT DEFAULT 'pending',
            operators TEXT, -- JSON string
            packet_loss REAL,
            speed REAL,
            quality_score INTEGER DEFAULT 0,
            real_test_results TEXT, -- JSON string
            reachable BOOLEAN DEFAULT 0,
            scanned BOOLEAN DEFAULT 0,
            source_id INTEGER,
            is_selected BOOLEAN DEFAULT 0,
            dislikes INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (source_id) REFERENCES sources (id)
          )
        `);
        
        // جدول آمار کلی
        db.run(`
          CREATE TABLE IF NOT EXISTS stats (
            id INTEGER PRIMARY KEY,
            total_scanned INTEGER DEFAULT 0,
            total_active INTEGER DEFAULT 0,
            total_selected INTEGER DEFAULT 0,
            total_dislikes INTEGER DEFAULT 0,
            dislikes_since_scan INTEGER DEFAULT 0,
            last_scan DATETIME,
            scan_completed_at DATETIME,
            next_scan_at DATETIME,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS server_dislikes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            server_id INTEGER NOT NULL,
            user_key TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(server_id, user_key),
            FOREIGN KEY (server_id) REFERENCES servers (id) ON DELETE CASCADE
          )
        `);

        db.run(
          'ALTER TABLE stats ADD COLUMN dislikes_since_scan INTEGER DEFAULT 0',
          [],
          () => {}
        );
        
        // اضافه کردن منابع پیش‌فرض
        const defaultSources = [
          "https://raw.githubusercontent.com/ShatakVPN/ConfigForge-V2Ray/refs/heads/main/configs/us/all.txt",
          "https://raw.githubusercontent.com/nyeinkokoaung404/V2ray-Configs/refs/heads/main/Sub2.txt",
          "https://raw.githubusercontent.com/V2RAYCONFIGSPOOL/V2RAY_SUB/refs/heads/main/v2ray_configs_no4.txt",
          "https://raw.githubusercontent.com/V2RAYCONFIGSPOOL/V2RAY_SUB/refs/heads/main/v2ray_configs_no3.txt",
          "https://raw.githubusercontent.com/V2RAYCONFIGSPOOL/V2RAY_SUB/refs/heads/main/v2ray_configs_no8.txt",
          "https://raw.githubusercontent.com/Arianlavi/RebeldevConfig/refs/heads/main/RebelLink/vless_subscriptions.txt",
          "https://raw.githubusercontent.com/Arianlavi/RebeldevConfig/refs/heads/main/RebelLink/trojan_subscriptions.txt",
          "https://raw.githubusercontent.com/MrAbolfazlNorouzi/iran-configs/refs/heads/main/configs/working-configs.txt",
          "https://raw.githubusercontent.com/V2RAYCONFIGSPOOL/V2RAY_SUB/refs/heads/main/v2ray_configs_no1.txt",
          "https://raw.githubusercontent.com/V2RAYCONFIGSPOOL/V2RAY_SUB/refs/heads/main/v2ray_configs_no6.txt",
          "https://raw.githubusercontent.com/barry-far/V2ray-Config/refs/heads/main/Sub25.txt",
          "https://raw.githubusercontent.com/Danialsamadi/v2go/refs/heads/main/Sub21.txt",
          "https://raw.githubusercontent.com/nyeinkokoaung404/V2ray-Configs/refs/heads/main/Sub1.txt",
          "https://raw.githubusercontent.com/ShatakVPN/ConfigForge-V2Ray/refs/heads/main/configs/ua/all.txt",

        ];
        
        defaultSources.forEach((url, index) => {
          db.run(
            'INSERT OR IGNORE INTO sources (url, name) VALUES (?, ?)',
            [url, `منبع ${index + 1}`]
          );
        });
        
        // ایجاد رکورد آمار اولیه
        db.run('INSERT OR IGNORE INTO stats (id) VALUES (1)', (err) => {
          if (err) {
            console.error('خطا در ایجاد آمار اولیه:', err);
            reject(err);
          } else {
            console.log('✅ جداول و داده‌های اولیه ایجاد شدند');
            resolve();
          }
        });
      });
    });
  });
};

export const getDatabase = () => db;

export const closeDatabase = () => {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('خطا در بستن دیتابیس:', err);
      } else {
        console.log('🔒 اتصال دیتابیس بسته شد');
      }
    });
  }
};
