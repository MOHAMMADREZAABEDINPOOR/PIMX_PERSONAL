import React, { useState } from 'react';
import { ServerConfig } from '../types';
import { Copy, Check, Zap, ThumbsDown, Shield } from 'lucide-react';

interface ServerCardProps {
  server: ServerConfig;
  onDislike?: (server: ServerConfig) => void;
  isDarkMode?: boolean;
}

export const ServerCard: React.FC<ServerCardProps> = ({ server, onDislike, isDarkMode = true }) => {
  const [copied, setCopied] = useState(false);
  const [disliked, setDisliked] = useState(false);

  // تابع برای کوتاه کردن اسم سرور به ۲۰ کاراکتر
  const truncateServerName = (name: string, maxChars: number = 20) => {
    if (name.length <= maxChars) {
      return name;
    }
    return name.slice(0, maxChars) + '...';
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(server.originalString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDislike = () => {
    setDisliked(!disliked);
    if (onDislike) {
      onDislike(server);
    }
  };

  // محاسبه رنگ بر اساس پینگ
  const getPingColor = (latency: number) => {
    if (latency < 100) return 'text-green-400';
    if (latency < 200) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getPingBadgeColor = (latency: number) => {
    if (latency < 100) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (latency < 200) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  return (
    <div className={`rounded-xl p-6 border transition-all duration-200 hover:shadow-lg ${
      isDarkMode 
        ? 'bg-slate-800 border-slate-700 hover:border-slate-600' 
        : 'bg-white border-gray-200 hover:border-gray-300'
    }`}>


      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
            server.protocol === 'vmess' 
              ? 'bg-purple-500/10 text-purple-500' 
              : 'bg-blue-500/10 text-blue-500'
          }`}>
            {server.protocol?.toUpperCase() || 'VLESS'}
          </span>
          <span className="px-3 py-1 rounded-lg text-xs font-medium bg-cyan-500/10 text-cyan-500">
            TCP
          </span>
        </div>
        
        {/* Ping Badge */}
        <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-mono ${
          server.latency < 100 
            ? 'bg-green-500/10 text-green-500' 
            : server.latency < 200 
              ? 'bg-yellow-500/10 text-yellow-500' 
              : 'bg-red-500/10 text-red-500'
        }`}>
          <Zap size={16} />
          <span className="font-bold">{server.latency || 0}ms</span>
        </div>
      </div>

      {/* Server Info */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-cyan-500/10">
            <Shield className="text-cyan-500" size={20} />
          </div>
          <h3 className={`font-semibold text-lg ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`} title={server.ps || 'Server'}>
            {truncateServerName(server.ps || 'Server')}
          </h3>
        </div>
        
        <div className={`text-sm font-mono mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {server.add}:{server.port}
        </div>
        <div className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          {server.country || 'نامشخص'} • {server.security || 'auto'}
        </div>
      </div>

      {/* اپراتورهای سازگار */}
      <div className="mb-6">
        <h4 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          اپراتورهای سازگار
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'mci', name: 'همراه اول' },
            { key: 'irancell', name: 'ایرانسل' },
            { key: 'rightel', name: 'رایتل' },
            { key: 'shatel', name: 'شاتل' },
            { key: 'mokhaberat', name: 'مخابرات' }
          ].map((operator) => {
            // استفاده از داده واقعی اپراتورها به جای تصادفی
            const isSupported = server.operators?.[operator.key as keyof typeof server.operators] || false;
            return (
              <div
                key={operator.key}
                className={`flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium ${
                  isSupported
                    ? isDarkMode 
                      ? 'bg-green-500/10 text-green-400' 
                      : 'bg-green-50 text-green-600'
                    : isDarkMode 
                      ? 'bg-red-500/10 text-red-400' 
                      : 'bg-red-50 text-red-600'
                }`}
              >
                <span>{isSupported ? '✓' : '✗'}</span>
                <span className="truncate">{operator.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button 
          onClick={handleCopy}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-sm transition-colors ${
            copied
              ? 'bg-green-500 text-white'
              : 'bg-cyan-500 hover:bg-cyan-600 text-white'
          }`}
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
          <span>{copied ? 'کپی شد' : 'کپی کانفیگ'}</span>
        </button>
        
        <button
          onClick={handleDislike}
          className={`px-4 py-3 flex items-center justify-center gap-2 rounded-lg font-medium text-sm transition-colors ${
            disliked
              ? 'bg-red-500 text-white'
              : isDarkMode
                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300'
                : 'bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700'
          }`}
          title="گزارش مشکل"
        >
          <ThumbsDown size={16} />
          <span>{disliked ? 'گزارش شد' : 'گزارش'}</span>
        </button>
      </div>
    </div>
  );
};