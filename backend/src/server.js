import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { initDatabase } from './database.js';
import { scanServers, getScanStatus } from './scanner.js';
import { getActiveServers, getStats, updateServerStats } from './services/serverService.js';
// فایل‌های مربوط به سیستم‌های قدیمی حذف شدند

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
await initDatabase();

// Routes
app.get('/api/servers', async (req, res) => {
  try {
    const servers = await getActiveServers();
    res.json(servers);
  } catch (error) {
    console.error('خطا در دریافت سرورها:', error);
    res.status(500).json({ error: 'خطا در دریافت سرورها' });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (error) {
    console.error('خطا در دریافت آمار:', error);
    res.status(500).json({ error: 'خطا در دریافت آمار' });
  }
});

app.post('/api/servers/:id/dislike', async (req, res) => {
  try {
    const { id } = req.params;
    await updateServerStats(id, 'dislike');
    res.json({ success: true });
  } catch (error) {
    console.error('خطا در ثبت دیسلایک:', error);
    res.status(500).json({ error: 'خطا در ثبت دیسلایک' });
  }
});

// وضعیت اسکن
app.get('/api/scan-status', async (req, res) => {
  try {
    const scanStatus = getScanStatus();
    const stats = await getStats();
    
    // محاسبه ثانیه‌های باقی‌مانده تا اسکن بعدی
    let secondsUntilNextScan = 0;
    if (stats.scan_completed_at && !scanStatus.isScanning) {
      const completedAt = new Date(stats.scan_completed_at);
      const nextScanAt = new Date(completedAt.getTime() + 60 * 60 * 1000); // 1 ساعت بعد
      const now = new Date();
      const remainingMs = nextScanAt.getTime() - now.getTime();
      secondsUntilNextScan = Math.max(0, Math.floor(remainingMs / 1000));
    }
    
    res.json({
      ...scanStatus,
      scanCompletedAt: stats.scan_completed_at,
      nextScanAt: stats.next_scan_at,
      secondsUntilNextScan
    });
  } catch (error) {
    console.error('خطا در دریافت وضعیت اسکن:', error);
    res.status(500).json({ error: 'خطا در دریافت وضعیت اسکن' });
  }
});

// API های مربوط به سیستم‌های قدیمی حذف شدند



// اسکن اولیه
console.log('🚀 شروع اسکن اولیه سرورها...');
scanServers().catch(console.error);

// سیستم‌های نظارت قدیمی حذف شدند - فقط تست اصلی باقی ماند

// اسکن خودکار هر ساعت
cron.schedule('0 * * * *', () => {
  console.log('⏰ شروع اسکن خودکار ساعتی...');
  scanServers().catch(console.error);
});

// سیستم اسکن اضطراری حذف شد - فقط اسکن ساعتی باقی ماند

app.listen(PORT, () => {
  console.log(`🌐 سرور بک‌اند روی پورت ${PORT} اجرا شد`);
});