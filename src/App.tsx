import React, { useState, useEffect } from 'react';
import { ServerCard } from '../components/ServerCard';
import { apiService } from './services/api';
import { ServerConfig } from '../types.ts';
import { Shield, RefreshCw, Copy, Wifi, Zap, Clock, Sun, Moon, HelpCircle, X, ChevronDown, Monitor, TrendingUp } from 'lucide-react';
import './animations.css';
import './responsive.css';
import './modern-styles.css';
import './clean-styles.css';
import './mobile-enhancements.css';

// اضافه کردن انیمیشن چرخش
const spinKeyframes = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// اضافه کردن استایل به head
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = spinKeyframes;
  document.head.appendChild(style);
}

const App = () => {
  const [servers, setServers] = useState<ServerConfig[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copyAllDone, setCopyAllDone] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [scanStatus, setScanStatus] = useState<any>(null);
  // سیستم تم پیشرفته
  const [themeMode, setThemeMode] = useState(() => {
    const savedTheme = localStorage.getItem('themeMode');
    return savedTheme || 'dark'; // پیش‌فرض: تم تاریک
  });
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [nextScanCountdown, setNextScanCountdown] = useState(0);


  // محاسبه تم فعلی بر اساس حالت انتخابی
  const isDarkMode = (() => {
    if (themeMode === 'system') {
      const hour = new Date().getHours();
      return hour < 6 || hour >= 18; // شب: 6 شب تا 6 صبح
    }
    return themeMode === 'dark';
  })();

  // ذخیره حالت تم در localStorage هنگام تغییر
  useEffect(() => {
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  // بروزرسانی تم سیستم هر دقیقه (فقط در حالت system)
  useEffect(() => {
    if (themeMode === 'system') {
      const interval = setInterval(() => {
        // فورس کردن re-render برای بررسی ساعت
        setThemeMode('system');
      }, 60000); // هر دقیقه چک کن
      
      return () => clearInterval(interval);
    }
  }, [themeMode]);

  // بستن dropdown وقتی کاربر جای دیگه کلیک کنه
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // چک کن که کلیک خارج از dropdown باشه
      if (showThemeDropdown && !target.closest('.theme-dropdown')) {
        setShowThemeDropdown(false);
      }
    };

    if (showThemeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showThemeDropdown]);

  // شمارش معکوس برای اسکن بعدی
  useEffect(() => {
    if (nextScanCountdown > 0) {
      const timer = setInterval(() => {
        setNextScanCountdown(prev => {
          const newValue = prev - 1;
          return newValue <= 0 ? 0 : newValue;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [nextScanCountdown]);

  // بارگذاری اولیه داده‌ها
  useEffect(() => {
    loadData();
    
    // رفرش خودکار - اگر اسکن در حال انجامه هر 5 ثانیه، وگرنه هر 60 ثانیه
    const getInterval = () => scanStatus?.isScanning ? 5000 : 60000;
    
    const interval = setInterval(() => {
      loadData();
    }, getInterval());
    
    return () => clearInterval(interval);
  }, [scanStatus?.isScanning]);

  const loadData = async () => {
    try {
      const [serversData, statsData, scanStatusData] = await Promise.all([
        apiService.getActiveServers(),
        apiService.getStats(),
        apiService.getScanStatus()
      ]);
      
      setServers(serversData);
      setStats(statsData);
      setScanStatus(scanStatusData);
      
      // اگر اسکن تمام شده، شمارش معکوس رو از سرور بگیر
      if (scanStatusData && !scanStatusData.isScanning && scanStatusData.secondsUntilNextScan !== undefined) {
        setNextScanCountdown(scanStatusData.secondsUntilNextScan);
      }
      
    } catch (error) {
      console.error('خطا در بارگذاری داده‌ها:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCopyAll = () => {
    const validServers = servers.filter(s => s.originalString && s.originalString.trim().length > 0);
    const text = validServers.map(s => s.originalString).join('\n');
    
    if (text) {
      navigator.clipboard.writeText(text);
      setCopyAllDone(true);
      setTimeout(() => setCopyAllDone(false), 2000);
    }
  };

  const handleDislike = async (server: ServerConfig) => {
    try {
      await apiService.dislikeServer(server.id);
      console.log('سرور دیسلایک شد:', server.ps);
    } catch (error) {
      console.error('خطا در ثبت دیسلایک:', error);
    }
  };



  // تابع تغییر تم
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setThemeMode(newTheme);
    setShowThemeDropdown(false);
  };

  // آیکون و متن برای هر حالت تم
  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case 'light': return <Sun size={20} />;
      case 'dark': return <Moon size={20} />;
      case 'system': return <Monitor size={20} />;
      default: return <Moon size={20} />;
    }
  };

  const getThemeLabel = (theme: string) => {
    switch (theme) {
      case 'light': return '☀️ روشن';
      case 'dark': return '🌙 تاریک';
      case 'system': return '🖥️ سیستم';
      default: return '🌙 تاریک';
    }
  };

  // فرمت کردن زمان شمارش معکوس
  const formatCountdown = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };



  // آمار محاسبه شده
  const activeCount = servers.length;
  const avgLatency = activeCount > 0 
    ? Math.round(servers.reduce((acc, curr) => acc + curr.latency, 0) / activeCount) 
    : 0;

  if (loading && servers.length === 0) {
    return (
      <div className={`min-h-screen flex items-center justify-center relative ${
        isDarkMode 
          ? 'bg-slate-900' 
          : 'bg-gray-50'
      }`}>
        <div className="text-center max-w-sm sm:max-w-md mx-auto px-4 relative z-10">
          {/* انیمیشن لودینگ مدرن */}
          <div className="relative mb-8">
            <div className="w-20 h-20 mx-auto relative">
              <div className="absolute inset-0 border-4 border-cyan-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap className="text-cyan-500" size={24} />
              </div>
            </div>
          </div>

          {/* متن اصلی */}
          <h2 className={`text-2xl font-semibold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            در حال اسکن سرورها
          </h2>
          
          {/* پیام وضعیت */}
          {scanStatus?.message && (
            <p className={`text-base mb-6 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {scanStatus.message}
            </p>
          )}


          
          {/* آمار لحظه‌ای */}
          {scanStatus?.isScanning && (
            <div className={`rounded-xl p-6 mb-8 border ${
              isDarkMode 
                ? 'bg-slate-800 border-slate-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className={`text-2xl font-bold mb-1 ${
                    isDarkMode ? 'text-cyan-400' : 'text-cyan-600'
                  }`}>
                    {scanStatus.tested || 0}
                  </div>
                  <div className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>تست شده</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold mb-1 ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`}>
                    {scanStatus.active || 0}
                  </div>
                  <div className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>فعال</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold mb-1 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    {scanStatus.total || 0}
                  </div>
                  <div className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>کل</div>
                </div>
              </div>
            </div>
          )}

          {/* توضیحات */}
          <div className={`text-base mb-6 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <p className="mb-2">در حال جستجوی سرورهای فعال...</p>
            <p>سرورها به محض یافتن نمایش داده می‌شوند</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-pattern-none no-lines no-gradient ${
      isDarkMode 
        ? 'bg-slate-900 text-white dark-mode-bg' 
        : 'bg-gray-50 text-gray-900 light-mode-bg'
    }`} style={{ 
      backgroundImage: 'none !important',
      backgroundColor: isDarkMode ? '#0f172a !important' : '#f9fafb !important',
      position: 'relative'
    }}>
      

      
      {/* Header مدرن */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-sm ${
        isDarkMode 
          ? 'bg-slate-900/95 border-slate-800' 
          : 'bg-white/95 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              isDarkMode ? 'bg-cyan-500/10' : 'bg-cyan-50'
            }`}>
              <Shield className="text-cyan-500" size={24} />
            </div>
            <a 
              href="https://t.me/PIMX_PASS" 
              target="_blank" 
              rel="noopener noreferrer"
              className={`text-xl font-bold ${
                isDarkMode ? 'text-white hover:text-cyan-400' : 'text-gray-900 hover:text-cyan-600'
              } transition-colors`}
            >
              PIMXPASS
            </a>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowHelpModal(true)}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'hover:bg-slate-800 text-gray-400 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
              title="راهنما"
            >
              <HelpCircle size={20} />
            </button>
            
            {/* Theme Toggle */}
            <div className="relative theme-dropdown">
              <button
                onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-slate-800 text-gray-400 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
                title="تغییر تم"
              >
                {getThemeIcon(themeMode)}
                <ChevronDown size={16} className={`transition-transform ${showThemeDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showThemeDropdown && (
                <div className={`absolute top-full right-0 mt-2 w-48 rounded-lg border shadow-lg z-50 ${
                  isDarkMode 
                    ? 'bg-slate-800 border-slate-700' 
                    : 'bg-white border-gray-200'
                }`}>
                  {['light', 'dark', 'system'].map((theme) => (
                    <button
                      key={theme}
                      onClick={() => handleThemeChange(theme as 'light' | 'dark' | 'system')}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-right transition-colors ${
                        themeMode === theme
                          ? isDarkMode 
                            ? 'bg-cyan-500/10 text-cyan-400' 
                            : 'bg-cyan-50 text-cyan-600'
                          : isDarkMode 
                            ? 'hover:bg-slate-700 text-gray-300' 
                            : 'hover:bg-gray-50 text-gray-700'
                      } ${
                        theme === 'light' ? 'rounded-t-lg' : 
                        theme === 'system' ? 'rounded-b-lg' : ''
                      }`}
                      dir="rtl"
                    >
                      <span>{getThemeIcon(theme)}</span>
                      <span className="font-medium">{getThemeLabel(theme)}</span>
                      {themeMode === theme && (
                        <span className="mr-auto text-sm">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              isDarkMode 
                ? 'bg-green-500/10 text-green-400' 
                : 'bg-green-50 text-green-600'
            }`}>
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="hidden sm:inline">آنلاین</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        {/* نوار پیشرفت اسکن - فقط وقتی اسکن در حال انجامه */}
        {scanStatus?.isScanning && (
          <div style={{
            backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
            border: `1px solid ${isDarkMode ? '#475569' : '#e5e7eb'}`,
            borderRadius: '12px',
            padding: '24px',
            margin: '16px 0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', direction: 'rtl' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ 
                  animation: 'spin 1s linear infinite',
                  color: '#06b6d4',
                  fontSize: '24px'
                }}>
                  🔄
                </div>
                <div>
                  <h3 style={{ 
                    fontWeight: '600', 
                    fontSize: '18px', 
                    marginBottom: '4px',
                    color: isDarkMode ? '#ffffff' : '#111827'
                  }}>
                    اسکن در حال انجام
                  </h3>
                  <p style={{ 
                    fontSize: '14px',
                    color: isDarkMode ? '#9ca3af' : '#6b7280'
                  }}>
                    {scanStatus?.message || 'در حال تست سرورها...'}
                  </p>
                </div>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  color: '#06b6d4',
                  marginBottom: '4px'
                }}>
                  {scanStatus?.progress || 0}%
                </div>
                <div style={{ 
                  fontSize: '14px',
                  color: isDarkMode ? '#9ca3af' : '#6b7280'
                }}>
                  {scanStatus?.tested || 0}/{scanStatus?.total || 0}
                </div>
              </div>
            </div>
            
            {/* نوار پیشرفت */}
            <div style={{
              height: '8px',
              backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div
                style={{
                  height: '100%',
                  background: 'linear-gradient(to right, #06b6d4, #3b82f6)',
                  width: `${(scanStatus?.progress ?? Math.round(((scanStatus?.tested || 0) / (scanStatus?.total || 1)) * 100))}%`,
                  transition: 'width 0.3s ease'
                }}
              ></div>
            </div>
          </div>
        )}


        
        {/* اطلاعات اسکن - فقط وقتی اسکن تمام شده */}
        {!scanStatus?.isScanning && nextScanCountdown > 0 && (
          <section className={`rounded-xl p-4 border ${
            isDarkMode 
              ? 'bg-slate-800 border-slate-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between text-right" dir="rtl">
              <div className="flex items-center gap-3">
                <Clock className="text-cyan-500" size={20} />
                <div>
                  <span className={`font-medium block ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    اسکن خودکار هر ساعت
                  </span>
                  {scanStatus?.lastScanTime && (
                    <span className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      آخرین اسکن: {new Date(scanStatus.lastScanTime).toLocaleString('fa-IR')}
                    </span>
                  )}
                </div>
              </div>
              
              {/* شمارش معکوس */}
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                isDarkMode 
                  ? 'bg-cyan-500/10 text-cyan-400' 
                  : 'bg-cyan-50 text-cyan-600'
              }`}>
                <span>اسکن بعدی:</span>
                <span className="font-mono font-bold">{formatCountdown(nextScanCountdown)}</span>
              </div>
            </div>
            
            <p className={`text-sm mt-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              سرورها به صورت خودکار اسکن و تست می‌شوند. حداکثر 150 سرور برتر نمایش داده می‌شود.
            </p>
          </section>
        )}

        {/* کانال تلگرام */}
        <section className={`rounded-xl p-6 border ${
          isDarkMode 
            ? 'bg-slate-800 border-slate-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="text-center" dir="rtl">
            <h3 className={`text-xl font-bold mb-3 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              عضویت در کانال تلگرام
            </h3>
            <p className={`text-base mb-6 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
برای اینکه این ارائه خدمات ما به شما ادامه پیدا کنه لطفا مارا در تلگرام حمایت کنید
            </p>
            <a
              href="https://t.me/PIMX_PASS"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors"
            >
              <span>📢</span>
              <span>عضویت در کانال</span>
            </a>
          </div>
        </section>



        {/* آمار */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`rounded-xl p-6 border ${
            isDarkMode 
              ? 'bg-slate-800 border-slate-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-cyan-500/10">
                <Wifi className="text-cyan-500" size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-cyan-500">
                  {activeCount}
                </div>
                <div className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  سرور فعال
                </div>
              </div>
            </div>
          </div>
          
          <div className={`rounded-xl p-6 border ${
            isDarkMode 
              ? 'bg-slate-800 border-slate-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Zap className="text-blue-500" size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-500">
                  {avgLatency}ms
                </div>
                <div className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  میانگین پینگ
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-xl p-6 border ${
            isDarkMode 
              ? 'bg-slate-800 border-slate-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <TrendingUp className="text-green-500" size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-500">
                  99%
                </div>
                <div className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  آپتایم
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* دکمه‌های عملیات */}
        <section className="flex justify-center">
          <button
            onClick={handleCopyAll}
            disabled={activeCount === 0}
            className={`flex items-center gap-3 px-6 py-3 rounded-lg font-medium transition-colors ${
              copyAllDone
                ? 'bg-green-500 text-white'
                : activeCount === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-cyan-500 hover:bg-cyan-600 text-white'
            }`}
          >
            <Copy size={20} />
            <span>
              {copyAllDone 
                ? `کپی شد (${activeCount} سرور)` 
                : `کپی همه سرورها (${activeCount})`
              }
            </span>
          </button>
        </section>



        {/* لیست سرورها */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              سرورهای فعال ({activeCount})
            </h2>
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${
              isDarkMode 
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                : 'bg-blue-50 text-blue-600 border border-blue-200'
            }`}>
              حداکثر 150 سرور
            </div>
          </div>
          
          {activeCount === 0 ? (
            <div className={`text-center py-16 rounded-xl border ${
              isDarkMode 
                ? 'bg-slate-800 border-slate-700' 
                : 'bg-white border-gray-200'
            }`}>
              <Wifi className="mx-auto mb-4 text-cyan-500" size={48} />
              <h3 className={`text-xl font-semibold mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                در حال جستجوی سرورها
              </h3>
              <p className={`text-base ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                لطفاً چند دقیقه صبر کنید تا سرورهای فعال پیدا شوند
              </p>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {servers
                .sort((a, b) => (a.latency || 999) - (b.latency || 999))
                .map((server) => (
                  <ServerCard
                    key={server.id}
                    server={server}
                    onDislike={handleDislike}
                    isDarkMode={isDarkMode}
                  />
                ))}
            </div>
          )}
        </section>
      </main>

      {/* راهنما */}
      {showHelpModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowHelpModal(false);
            }
          }}
        >
          <div className={`relative w-full max-w-2xl rounded-xl border max-h-[90vh] flex flex-col overflow-hidden ${
            isDarkMode 
              ? 'bg-slate-800 border-slate-700' 
              : 'bg-white border-gray-200'
          }`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${
              isDarkMode ? 'border-slate-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10">
                  <Shield className="text-cyan-500" size={20} />
                </div>
                <h2 className={`text-xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  راهنمای PIMXPASS
                </h2>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-slate-700 text-gray-400 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
              >
                <X size={20} />
              </button>
            </div>

            {/* محتوا */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6" dir="rtl">
              {/* مقدمه */}
              <div className={`rounded-lg p-4 ${
                isDarkMode ? 'bg-slate-700' : 'bg-gray-50'
              }`}>
                <h3 className={`text-lg font-semibold mb-3 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  PIMXPASS چیست؟
                </h3>
                <p className={`text-sm leading-relaxed ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  PIMXPASS یک سیستم خودکار برای یافتن و تست سرورهای V2Ray فعال است. این سیستم به صورت مداوم سرورها را اسکن کرده و بهترین‌ها را برای شما فراهم می‌کند.
                </p>
              </div>

              {/* نحوه کار */}
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  نحوه کار سیستم
                </h3>
                <div className="space-y-4">
                  <div className={`flex gap-4 p-4 rounded-lg ${
                    isDarkMode ? 'bg-slate-700' : 'bg-gray-50'
                  }`}>
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div>
                      <p className={`font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>اسکن خودکار</p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        سیستم هر ساعت هزاران سرور V2Ray را جمع‌آوری و تست می‌کند
                      </p>
                    </div>
                  </div>
                  
                  <div className={`flex gap-4 p-4 rounded-lg ${
                    isDarkMode ? 'bg-slate-700' : 'bg-gray-50'
                  }`}>
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div>
                      <p className={`font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>تست کیفیت</p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        هر سرور از نظر سرعت و پینگ تست شده و فقط سرورهای فعال نمایش داده می‌شوند
                      </p>
                      <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        ممکن است بعضی از سرورها غیر فعال باشند اما بیش از 70 درصد سرورها فعال هستند
                      </p>
                    </div>
                  </div>

                  <div className={`flex gap-4 p-4 rounded-lg ${
                    isDarkMode ? 'bg-slate-700' : 'bg-gray-50'
                  }`}>
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div>
                      <p className={`font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>مرتب‌سازی</p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        سرورها بر اساس کیفیت مرتب شده و حداکثر 150 سرور برتر نمایش داده می‌شوند
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* نحوه استفاده */}
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  نحوه استفاده
                </h3>
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${
                    isDarkMode ? 'bg-slate-700' : 'bg-gray-50'
                  }`}>
                    <p className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>1. کپی کردن سرور</p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      روی دکمه کپی هر سرور کلیک کنید یا از دکمه "کپی همه" استفاده کنید
                    </p>
                  </div>

                  <div className={`p-4 rounded-lg ${
                    isDarkMode ? 'bg-slate-700' : 'bg-gray-50'
                  }`}>
                    <p className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>2. وارد کردن در اپلیکیشن</p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      سرور کپی شده را در V2RayNG، Clash یا سایر کلاینت‌ها وارد کنید
                    </p>
                  </div>

                  <div className={`p-4 rounded-lg ${
                    isDarkMode ? 'bg-slate-700' : 'bg-gray-50'
                  }`}>
                    <p className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>3. تست و استفاده</p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      سرور را تست کنید و در صورت عدم کارکرد، سرور دیگری امتحان کنید
                    </p>
                  </div>
                </div>
              </div>

              {/* نکات مهم */}
              <div className={`rounded-lg p-4 ${
                isDarkMode ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <h3 className={`text-lg font-semibold mb-3 ${
                  isDarkMode ? 'text-yellow-400' : 'text-yellow-800'
                }`}>
                  نکات مهم
                </h3>
                <ul className={`space-y-2 text-sm ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                  <li>• این سرویس کاملاً رایگان و بدون تبلیغات است</li>
                  <li>• سرورها از منابع عمومی جمع‌آوری شده و ممکن است بعضی از سرورها غیرفعال باشند</li>
                  <li>• برای بهترین تجربه، چندین سرور را تست کنید</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
