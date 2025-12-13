import axios from 'axios';
import { getDatabase } from './database.js';
import { parseServerConfigs } from './utils/parser.js';
import { testServersBatch } from './utils/serverTester.js';

// وضعیت اسکن
let scanStatus = {
  isScanning: false,
  progress: 0,
  total: 0,
  tested: 0,
  active: 0,
  message: 'آماده'
};

export const getScanStatus = () => scanStatus;

const updateScanStatus = (updates) => {
  scanStatus = { ...scanStatus, ...updates };
};

const SERVERS_TO_TEST = 1000; // تعداد سرورهایی که باید تست بشن
const MAX_SELECTED_SERVERS = 150; // حداکثر تعداد سرورهای نمایش داده شده
const MIN_SELECTED_SERVERS = 100; // حداقل تعداد سرورهای نمایش داده شده

export const scanServers = async () => {
  const db = getDatabase();
  console.log('🔍 شروع اسکن سرورها...');
  
  updateScanStatus({
    isScanning: true,
    progress: 0,
    tested: 0,
    active: 0,
    message: 'شروع اسکن...'
  });
  
  try {
    // دریافت منابع فعال
    const sources = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM sources WHERE active = 1', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`📡 ${sources.length} منبع فعال پیدا شد`);
    
    // همیشه 1000 سرور تست می‌کنیم
    const serversNeeded = SERVERS_TO_TEST;
    console.log(`🔄 شروع تست ${serversNeeded} سرور...`);
    
    let allNewConfigs = [];
    let sourceIndex = 0;
    
    // دریافت کانفیگ از منابع مختلف
    for (const source of sources) {
      if (allNewConfigs.length >= serversNeeded) break;
      
      try {
        console.log(`📥 دریافت از منبع: ${source.name}`);
        const response = await axios.get(source.url, { 
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        const configs = parseServerConfigs(response.data);
        console.log(`✅ ${configs.length} کانفیگ از ${source.name} دریافت شد`);
        
        // اضافه کردن source_id به هر کانفیگ
        configs.forEach(config => {
          config.source_id = source.id;
        });
        
        allNewConfigs.push(...configs);
        
        // به‌روزرسانی زمان اسکن منبع
        db.run(
          'UPDATE sources SET last_scan = CURRENT_TIMESTAMP WHERE id = ?',
          [source.id]
        );
        
        sourceIndex++;
        
      } catch (error) {
        console.error(`❌ خطا در دریافت از ${source.name}:`, error.message);
      }
    }
    
    console.log(`📦 مجموع ${allNewConfigs.length} کانفیگ دریافت شد`);
    
    if (allNewConfigs.length === 0) {
      console.log('⚠️ هیچ کانفیگ جدیدی دریافت نشد');
      updateScanStatus({
        isScanning: false,
        message: 'هیچ کانفیگی یافت نشد'
      });
      return;
    }
    
    // حذف تکراری‌ها
    const uniqueConfigs = allNewConfigs.filter((config, index, arr) => 
      index === arr.findIndex(c => c.originalString === config.originalString)
    );
    
    console.log(`🔄 ${uniqueConfigs.length} کانفیگ منحصر به فرد برای تست`);
    
    console.log(`🔄 ${uniqueConfigs.length} کانفیگ منحصر به فرد برای تست`);
    
    updateScanStatus({
      total: serversNeeded,
      message: `در حال تست ${serversNeeded} سرور...`
    });
    
    // تست سرورها
    const testedServers = [];
    let processedCount = 0;
    let activeCount = 0;
    
    await testServersBatch(
      uniqueConfigs.slice(0, serversNeeded),
      async (testedServer) => {
        testedServers.push(testedServer);
        processedCount++;
        
        if (testedServer.status === 'active') {
          activeCount++;
          
          // ذخیره فوری سرور فعال در دیتابیس
          try {
            await new Promise((resolve, reject) => {
              db.run(`
                INSERT OR REPLACE INTO servers (
                  config_string, protocol, transport, tls, name, address, port, host, path, country,
                  latency, status, operators, packet_loss, speed, quality_score, reachable, scanned, source_id,
                  is_selected, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
              `, [
                testedServer.originalString,
                testedServer.protocol,
                testedServer.transport || 'tcp',
                testedServer.tls || '',
                testedServer.ps || 'بدون نام',
                testedServer.add,
                testedServer.port,
                testedServer.host || testedServer.add,
                testedServer.path || '/',
                testedServer.country || 'نامشخص',
                testedServer.latency || 999,
                testedServer.status,
                JSON.stringify(testedServer.operators || {}),
                testedServer.packetLoss || 0,
                testedServer.speed || 0,
                85, // quality score ثابت برای سرورهای فعال
                testedServer.reachable ? 1 : 0,
                testedServer.scanned ? 1 : 0,
                testedServer.source_id,
                1 // is_selected = true
              ], (err) => {
                if (err) reject(err);
                else resolve();
              });
            });
          } catch (error) {
            console.error('خطا در ذخیره فوری سرور:', error);
          }
        }
        
        // به‌روزرسانی وضعیت
        updateScanStatus({
          tested: processedCount,
          active: activeCount,
          progress: Math.round((processedCount / serversNeeded) * 100),
          message: `${processedCount} از ${serversNeeded} سرور تست شد (${activeCount} فعال)`
        });
        
        if (processedCount % 50 === 0) {
          console.log(`⏳ ${processedCount} سرور تست شد... (${activeCount} فعال)`);
        }
      },
      () => false // shouldStop function
    );
    
    console.log(`🧪 ${testedServers.length} سرور تست شد`);
    
    // ذخیره در دیتابیس
    const activeServers = testedServers.filter(s => s.status === 'active');
    console.log(`✅ ${activeServers.length} سرور فعال پیدا شد`);
    
    // فقط سرورهای غیرفعال رو ذخیره می‌کنیم (فعال‌ها قبلاً ذخیره شدن)
    for (const server of testedServers) {
      if (server.status !== 'active') {
        try {
          await new Promise((resolve, reject) => {
            db.run(`
              INSERT OR REPLACE INTO servers (
                config_string, protocol, transport, tls, name, address, port, host, path, country,
                latency, status, operators, packet_loss, speed, quality_score, reachable, scanned, source_id,
                is_selected, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `, [
              server.originalString,
              server.protocol,
              server.transport || 'tcp',
              server.tls || '',
              server.ps || 'بدون نام',
              server.add,
              server.port,
              server.host || server.add,
              server.path || '/',
              server.country || 'نامشخص',
              server.latency || 999,
              server.status,
              JSON.stringify(server.operators || {}),
              server.packetLoss || 0,
              server.speed || 0,
              0, // quality score برای سرورهای غیرفعال
              server.reachable ? 1 : 0,
              server.scanned ? 1 : 0,
              server.source_id,
              0 // is_selected = false
            ], (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        } catch (error) {
          console.error('خطا در ذخیره سرور:', error);
        }
      }
    }
    
    // مدیریت سرورهای منتخب (حداکثر 150) - ساده شده
    await manageSelectedServers();

    // به‌روزرسانی آمار
    await updateStats();
    
    // محاسبه زمان اسکن بعدی (1 ساعت بعد)
    const scanCompletedAt = new Date();
    const nextScanAt = new Date(scanCompletedAt.getTime() + 60 * 60 * 1000); // 1 ساعت بعد
    
    // ذخیره زمان تکمیل اسکن در دیتابیس
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE stats SET 
          scan_completed_at = ?,
          next_scan_at = ?
        WHERE id = 1
      `, [scanCompletedAt.toISOString(), nextScanAt.toISOString()], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    updateScanStatus({
      isScanning: false,
      progress: 100,
      message: `اسکن تکمیل شد - ${activeServers.length} سرور فعال (حداکثر 150 نمایش)`,
      scanCompletedAt: scanCompletedAt.toISOString(),
      nextScanAt: nextScanAt.toISOString()
    });
    
    console.log('🎉 اسکن با موفقیت تکمیل شد');
    
  } catch (error) {
    console.error('❌ خطا در اسکن سرورها:', error);
    updateScanStatus({
      isScanning: false,
      message: 'خطا در اسکن'
    });
  }
};

const manageSelectedServers = async () => {
  const db = getDatabase();
  
  // شمارش سرورهای منتخب فعلی
  const currentSelected = await new Promise((resolve, reject) => {
    db.get(
      'SELECT COUNT(*) as count FROM servers WHERE is_selected = 1 AND status = "active"',
      (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      }
    );
  });
  
  console.log(`📊 سرورهای منتخب فعلی: ${currentSelected}`);
  
  if (currentSelected > MAX_SELECTED_SERVERS) {
    // حذف سرورهای اضافی (بدترین کیفیت و قدیمی‌ترین‌ها)
    const toRemove = currentSelected - MAX_SELECTED_SERVERS;
    console.log(`🗑️ حذف ${toRemove} سرور اضافی برای رسیدن به حداکثر ${MAX_SELECTED_SERVERS} سرور...`);
    
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE servers 
        SET is_selected = 0 
        WHERE id IN (
          SELECT id FROM servers 
          WHERE is_selected = 1 AND status = "active"
          ORDER BY latency DESC, dislikes DESC, updated_at ASC 
          LIMIT ?
        )
      `, [toRemove], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
  } else if (currentSelected < MIN_SELECTED_SERVERS) {
    // اضافه کردن سرورهای جدید (بهترین کیفیت)
    const toAdd = MIN_SELECTED_SERVERS - currentSelected;
    console.log(`➕ اضافه کردن ${toAdd} سرور جدید برای رسیدن به حداقل ${MIN_SELECTED_SERVERS} سرور...`);
    
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE servers 
        SET is_selected = 1 
        WHERE id IN (
          SELECT id FROM servers 
          WHERE is_selected = 0 AND status = "active" AND latency < 250
          ORDER BY latency ASC, dislikes ASC, updated_at DESC 
          LIMIT ?
        )
      `, [toAdd], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
  
  console.log(`✅ مدیریت سرورها تکمیل شد - حداکثر ${MAX_SELECTED_SERVERS} سرور نمایش داده می‌شود`);
};



const updateStats = async () => {
  const db = getDatabase();
  
  const stats = await new Promise((resolve, reject) => {
    db.get(`
      SELECT 
        COUNT(*) as total_scanned,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as total_active,
        SUM(CASE WHEN is_selected = 1 THEN 1 ELSE 0 END) as total_selected,
        SUM(dislikes) as total_dislikes
      FROM servers
    `, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
  
  db.run(`
    UPDATE stats SET 
      total_scanned = ?,
      total_active = ?,
      total_selected = ?,
      total_dislikes = ?,
      last_scan = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `, [
    stats.total_scanned,
    stats.total_active, 
    stats.total_selected,
    stats.total_dislikes
  ]);
  
  console.log(`📈 آمار به‌روزرسانی شد: ${stats.total_active} فعال از ${stats.total_scanned} تست شده`);
};


