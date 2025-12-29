import React, { useState, useEffect } from 'react';
import { ServerCard } from '../components/ServerCard';
import { apiService } from './services/api';
import { ServerConfig } from '../types';
import { Shield, RefreshCw, Copy, Wifi, Zap, Clock, Sun, Moon, HelpCircle, X, ChevronDown, Monitor, TrendingUp } from 'lucide-react';

// Add spinner animation
const spinKeyframes = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// Inject spinner style in head
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
  // Theme state
  const [themeMode, setThemeMode] = useState(() => {
    const savedTheme = localStorage.getItem('themeMode');
    return savedTheme || 'dark';
  });
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [nextScanCountdown, setNextScanCountdown] = useState(0);


  // Resolve theme
  const isDarkMode = (() => {
    if (themeMode === 'system') {
      const hour = new Date().getHours();
      return hour < 6 || hour >= 18;
    }
    return themeMode === 'dark';
  })();

  // Persist theme
  useEffect(() => {
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  // Update theme on system changes
  useEffect(() => {
    if (themeMode === 'system') {
      const interval = setInterval(() => {
        // Force re-render for theme refresh
        setThemeMode('system');
      }, 60000);
      
      return () => clearInterval(interval);
    }
  }, [themeMode]);

  // Close theme dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // Check click outside dropdown
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

  // Countdown for next scan
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

  // Initial data load
  useEffect(() => {
    loadData();
    
    // Auto refresh cadence based on scan state
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
      
      // Set countdown when scan completed
      if (scanStatusData && !scanStatusData.isScanning && scanStatusData.secondsUntilNextScan !== undefined) {
        setNextScanCountdown(scanStatusData.secondsUntilNextScan);
      }
      
    } catch (error) {
      console.error('خطا در بارگذاری داده ها:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const brandName = 'PIMXPASS';

  const sanitizeConfigString = (config: string) => {
    if (!config) return config;
    const hashIndex = config.indexOf('#');
    if (hashIndex === -1) {
      return config;
    }
    const prefix = config.slice(0, hashIndex + 1);
    const fragment = config.slice(hashIndex + 1).trim();
    const flagMatch = fragment.match(/^([\u{1F1E6}-\u{1F1FF}]{2})/u);
    const flag = flagMatch ? `${flagMatch[1]} ` : '';
    return `${prefix}${flag}${brandName}`;
  };

  const getDisplayName = (server: ServerConfig) => {
    const config = server.originalString || server.config_string || '';
    const hashIndex = config.indexOf('#');
    if (hashIndex === -1) {
      return brandName;
    }
    const fragment = config.slice(hashIndex + 1).trim();
    const flagMatch = fragment.match(/^([\u{1F1E6}-\u{1F1FF}]{2})/u);
    const flag = flagMatch ? `${flagMatch[1]} ` : '';
    return `${flag}${brandName}`;
  };

  const handleCopyAll = () => {
    const validServers = displayServers.filter(s => (s.originalString || s.config_string) && (s.originalString || s.config_string).trim().length > 0);
    const text = validServers.map(s => sanitizeConfigString(s.originalString || s.config_string)).join('\n');
    
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

  const handleUndislike = async (server: ServerConfig) => {
    try {
      await apiService.undislikeServer(server.id);
      console.log('دیسلایک برداشته شد:', server.ps);
    } catch (error) {
      console.error('خطا در حذف دیسلایک:', error);
    }
  };



  // Theme change handler
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setThemeMode(newTheme);
    setShowThemeDropdown(false);
  };

  // Theme label/icon helpers
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
      case 'light': return 'روشن';
      case 'dark': return 'تاریک';
      case 'system': return 'سیستم';
      default: return 'تاریک';
    }
  };

  // Format countdown
  const formatCountdown = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };



  // Stats
  const isScanning = !!scanStatus?.isScanning;
  const filteredServers = servers.filter((server) =>
    server.status === 'active' && (server.latency ?? 999) < 250
  );
  const displayServers = filteredServers;
  const activeCount = displayServers.length;
  const avgLatency = displayServers.length > 0
    ? Math.round(displayServers.reduce((acc, curr) => acc + curr.latency, 0) / displayServers.length)
    : 0;
  const canCopy = activeCount > 0;

  if (loading && servers.length === 0) {
    return (
      <div className={`min-h-screen flex items-center justify-center relative ${
        isDarkMode 
          ? 'bg-slate-900' 
          : 'bg-gray-50'
      }`}>
        <div className="text-center max-w-sm sm:max-w-md mx-auto px-4 relative z-10">
          {/* Loading animation */}
          <div className="relative mb-8">
            <div className="w-20 h-20 mx-auto relative">
              <div className="absolute inset-0 border-4 border-cyan-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap className="text-cyan-500" size={24} />
              </div>
            </div>
          </div>

          {/* Main text */}
          <h2 className={`text-2xl font-semibold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            در حال دریافت وضعیت اسکن
          </h2>
          
          {/* Status message */}
          {scanStatus?.message && (
            <p className={`text-base mb-6 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {scanStatus.message}
            </p>
          )}


          
          {/* Live stats */}
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

          {/* Details */}
          <div className={`text-base mb-6 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <p className="mb-2">در حال بررسی وضعیت سرورها و به روزرسانی داده ها...</p>
            <p>در پایان اسکن، سرورهای فعال با بهترین کیفیت نمایش داده می شوند.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isDarkMode ? 'theme-dark' : 'theme-light'} tech-shell`}>
      

      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 tech-header">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between tech-layer">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl tech-icon">
              <Shield size={24} />
            </div>
            <a 
              href="https://t.me/PIMX_PASS" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xl font-bold tech-title tech-link"
            >
              PIMXPASS
            </a>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHelpModal(true)}
              className="p-2 rounded-lg tech-button-ghost"
              title="راهنما"
            >
              <HelpCircle size={20} />
            </button>
            
            {/* Theme Toggle */}
            <div className="relative theme-dropdown">
              <button
                onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                className="flex items-center gap-2 p-2 rounded-lg tech-button-ghost"
                title="تغییر پوسته"
              >
                {getThemeIcon(themeMode)}
                <ChevronDown size={16} className={`transition-transform ${showThemeDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showThemeDropdown && (
                <div className="absolute top-full right-0 mt-2 w-48 rounded-lg shadow-lg z-50 tech-panel">
                  {['light', 'dark', 'system'].map((theme) => (
                    <button
                      key={theme}
                      onClick={() => handleThemeChange(theme as 'light' | 'dark' | 'system')}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-right transition-colors ${
                        theme === 'light' ? 'rounded-t-lg' : 
                        theme === 'system' ? 'rounded-b-lg' : ''
                      }`}
                      style={{
                        background: themeMode === theme ? 'rgba(45, 251, 209, 0.12)' : 'transparent',
                        color: themeMode === theme ? 'var(--accent)' : 'var(--text-muted)'
                      }}
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
            
            <div
              className="flex items-center gap-2 px-3 py-1 rounded-full text-sm"
              style={{
                background: 'rgba(34, 197, 94, 0.12)',
                color: '#22c55e',
                border: '1px solid rgba(34, 197, 94, 0.2)'
              }}
            >
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="hidden sm:inline">آنلاین</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pb-8 pt-24 space-y-8 tech-layer">
        
        {/* Scan progress */}
        {scanStatus?.isScanning && (
          <section className="tech-panel tech-panel-strong p-6 space-y-5">
            <div className="flex items-center justify-between gap-4 flex-wrap" dir="rtl">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full flex items-center justify-center tech-icon animate-spin">
                  <RefreshCw size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold tech-title">اسکن در حال انجام است.</h3>
                  <p className="text-sm tech-muted">
                    {scanStatus?.message || 'در حال تست سرورها...'}
                  </p>
                </div>
              </div>
              <div className="text-left">
                <div className="text-3xl font-bold" style={{ color: 'var(--accent)' }}>
                  {scanStatus?.progress || 0}%
                </div>
                <div className="text-sm tech-dim">
                  {scanStatus?.tested || 0}/{scanStatus?.total || 0}
                </div>
              </div>
            </div>
            <div className="tech-scan-bar">
              <span style={{
                width: `${(scanStatus?.progress ?? Math.round(((scanStatus?.tested || 0) / (scanStatus?.total || 1)) * 100))}%`
              }}></span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="tech-panel p-3">
                <div className="text-2xl font-bold" style={{ color: 'var(--accent-2)' }}>
                  {scanStatus?.tested || 0}
                </div>
                <div className="text-xs tech-dim">تست شده</div>
              </div>
              <div className="tech-panel p-3">
                <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
                  {scanStatus?.active || 0}
                </div>
                <div className="text-xs tech-dim">فعال</div>
              </div>
              <div className="tech-panel p-3">
                <div className="text-2xl font-bold" style={{ color: 'var(--accent-3)' }}>
                  {scanStatus?.total || 0}
                </div>
                <div className="text-xs tech-dim">کل</div>
              </div>
            </div>
          </section>
        )}


        
        {/* Scan info */}
        {!scanStatus?.isScanning && nextScanCountdown > 0 && (
          <section className="tech-panel p-5 space-y-3">
            <div className="flex items-center justify-between text-right" dir="rtl">
              <div className="flex items-center gap-3">
                <Clock size={20} style={{ color: 'var(--accent-2)' }} />
                <div>
                  <span className="font-medium block">اسکن بعدی در راه است</span>
                  {scanStatus?.lastScanTime && (
                    <span className="text-sm tech-muted">آخرین اسکن: {new Date(scanStatus.lastScanTime).toLocaleString('fa-IR')}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Countdown */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm"
                style={{
                  background: 'rgba(45, 251, 209, 0.12)',
                  color: 'var(--accent)',
                  border: '1px solid rgba(45, 251, 209, 0.24)'
                }}>
                <span>زمان تا اسکن بعدی:</span>
                <span className="font-mono font-bold">{formatCountdown(nextScanCountdown)}</span>
              </div>
            </div>
            
            <p className="text-sm mt-3 tech-muted">اسکن بعدی به صورت خودکار انجام می شود و حداکثر 150 سرور نمایش داده خواهد شد.</p>
          </section>
        )}

        {/* Telegram */}
        <section className="tech-panel p-6">
          <div className="text-center" dir="rtl">
            <h3 className="text-2xl font-bold mb-3 tech-title">عضویت در کانال تلگرام</h3>
            <p className="text-base mb-6 tech-muted">برای دریافت بروزرسانی ها و پشتیبانی، لطفا در کانال تلگرام عضو شوید.</p>
            <a
              href="https://t.me/PIMX_PASS"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-6 py-3 tech-button"
            >
              <span>تلگرام</span>
              <span>عضویت در کانال</span>
            </a>
          </div>
        </section>



        {/* Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="tech-stat">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl" style={{
                background: 'rgba(45, 251, 209, 0.12)',
                color: 'var(--accent)',
                border: '1px solid rgba(45, 251, 209, 0.24)'
              }}>
                <Wifi size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
                  {activeCount}
                </div>
                <div className="text-sm tech-muted">سرور فعال</div>
              </div>
            </div>
          </div>

          <div className="tech-stat">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl" style={{
                background: 'rgba(91, 157, 255, 0.14)',
                color: 'var(--accent-2)',
                border: '1px solid rgba(91, 157, 255, 0.24)'
              }}>
                <Zap size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: 'var(--accent-2)' }}>
                  {avgLatency}ms
                </div>
                <div className="text-sm tech-muted">میانگین پینگ</div>
              </div>
            </div>
          </div>

          <div className="tech-stat">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl" style={{
                background: 'rgba(245, 158, 11, 0.16)',
                color: 'var(--accent-3)',
                border: '1px solid rgba(245, 158, 11, 0.24)'
              }}>
                <TrendingUp size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: 'var(--accent-3)' }}>
                  99%
                </div>
                <div className="text-sm tech-muted">آپتایم</div>
              </div>
            </div>
          </div>
        </section>

        {/* Actions */}
        <section className="flex justify-center">
          <button
            onClick={handleCopyAll}
            disabled={!canCopy}
            className={`flex items-center gap-3 px-6 py-3 rounded-lg font-medium transition-colors ${
              copyAllDone
                ? 'bg-green-500 text-white'
                : canCopy
                ? 'tech-button'
                : 'tech-button-ghost opacity-60 cursor-not-allowed'
            }`}
          >
            <Copy size={20} />
            <span>
              {copyAllDone 
                ? `کپی شد (${activeCount} سرور)` 
                : canCopy
                ? `کپی همه سرورها (${activeCount})`
                : 'لیستی برای کپی نیست'
              }
            </span>
          </button>
        </section>



        {/* Server list */}
        <section className="tech-active-section">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h2 className="text-2xl font-bold tech-title">سرورهای فعال ({activeCount})</h2>
              {isScanning && (
                <p className="text-sm tech-muted mt-1">نتایج در حال بروزرسانی است و به محض آماده شدن نمایش داده می شود.</p>
              )}
            </div>
            <div className="tech-chip chip-blue">حداکثر 150 سرور</div>
          </div>
          {displayServers.length === 0 ? (
            <div className="text-center py-16 tech-list-empty">
              <Wifi className="mx-auto mb-4" size={48} style={{ color: 'var(--accent)' }} />
              <h3 className="text-xl font-semibold mb-2 tech-title">
                {isScanning ? 'در حال بروزرسانی لیست' : 'سرور فعالی پیدا نشد'}
              </h3>
              <p className="text-base tech-muted">
                {isScanning
                  ? 'به محض آماده شدن، سرورهای فعال نمایش داده می شوند.'
                  : 'لطفا چند دقیقه دیگر دوباره تلاش کنید یا منتظر اسکن بعدی بمانید.'
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {displayServers
                .sort((a, b) => (a.latency || 999) - (b.latency || 999))
                .map((server) => (
                  <ServerCard
                    key={server.id}
                    server={server}
                    onDislike={handleDislike}
                    onUndislike={handleUndislike}
                    isDarkMode={isDarkMode}
                    displayName={getDisplayName(server)}
                    displayConfig={sanitizeConfigString(server.originalString || server.config_string)}
                  />
                ))}
            </div>
          )}
        </section>
      </main>

      {/* Help */}
      {showHelpModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowHelpModal(false);
            }
          }}
        >
          <div className="relative w-full max-w-2xl rounded-xl max-h-[90vh] flex flex-col overflow-hidden tech-panel">
            <div
              className="flex items-center justify-between p-6"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg tech-icon">
                  <Shield size={20} />
                </div>
                <h2 className="text-xl font-bold tech-title">راهنمای PIMXPASS</h2>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-2 rounded-lg tech-button-ghost"
                title="بستن"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6" dir="rtl">
              <div className="tech-panel p-4">
                <h3 className="text-lg font-semibold mb-3 tech-title">PIMXPASS چیست؟</h3>
                <p className="text-sm tech-muted leading-relaxed">
                  PIMXPASS وضعیت سرورها را به صورت خودکار بررسی می کند و بهترین گزینه ها را نمایش می دهد.
                  در این صفحه می توانید روند اسکن و کیفیت سرورها را مشاهده کنید.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 tech-title">مراحل استفاده</h3>
                <div className="space-y-3">
                  <div className="flex gap-3 tech-panel p-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'rgba(45, 251, 209, 0.15)', color: 'var(--accent)' }}>1</div>
                    <div>
                      <p className="font-medium mb-1">کپی کردن سرور</p>
                      <p className="text-sm tech-muted">یکی از سرورها را کپی کنید یا کپی همه را بزنید.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 tech-panel p-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'rgba(91, 157, 255, 0.18)', color: 'var(--accent-2)' }}>2</div>
                    <div>
                      <p className="font-medium mb-1">وارد کردن در اپ</p>
                      <p className="text-sm tech-muted">لینک را در برنامه های V2Ray یا Clash وارد کنید.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 tech-panel p-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'rgba(245, 158, 11, 0.18)', color: 'var(--accent-3)' }}>3</div>
                    <div>
                      <p className="font-medium mb-1">تست و انتخاب</p>
                      <p className="text-sm tech-muted">سریع ترین سرور را انتخاب و استفاده کنید.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="tech-panel p-4">
                <h3 className="text-lg font-semibold mb-3 tech-title">نکات مهم</h3>
                <ul className="space-y-2 text-sm tech-muted">
                  <li>هنگام اسکن، نتایج پس از پایان نمایش داده می شود.</li>
                  <li>هر چند دقیقه یکبار صفحه را تازه کنید.</li>
                  <li>در صورت خطا، اتصال اینترنت و آدرس API را بررسی کنید.</li>
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














