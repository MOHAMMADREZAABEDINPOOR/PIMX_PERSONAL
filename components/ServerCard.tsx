import React, { useEffect, useState } from 'react';
import { ServerConfig } from '../types';
import { Copy, Check, Zap, ThumbsDown, Shield } from 'lucide-react';

interface ServerCardProps {
  server: ServerConfig;
  onDislike?: (server: ServerConfig) => void;
  onUndislike?: (server: ServerConfig) => void;
  isDarkMode?: boolean;
  displayName?: string;
  displayConfig?: string;
}

const DISLIKES_STORAGE_KEY = 'pimxpass_dislikes';

const loadDislikedIds = () => {
  try {
    const raw = localStorage.getItem(DISLIKES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveDislikedIds = (ids: Array<number | string>) => {
  try {
    localStorage.setItem(DISLIKES_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Ignore storage errors
  }
};

export const ServerCard: React.FC<ServerCardProps> = ({
  server,
  onDislike,
  onUndislike,
  isDarkMode = true,
  displayName,
  displayConfig
}) => {
  const [copied, setCopied] = useState(false);
  const [disliked, setDisliked] = useState(false);

  useEffect(() => {
    const ids = loadDislikedIds();
    setDisliked(ids.includes(server.id));
  }, [server.id]);

  const truncateServerName = (name: string, maxChars: number = 20) => {
    if (name.length <= maxChars) {
      return name;
    }
    return name.slice(0, maxChars) + '...';
  };

  const handleCopy = () => {
    const text = displayConfig || server.originalString;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDislike = () => {
    const ids = loadDislikedIds();

    if (disliked) {
      const nextIds = ids.filter((id) => id !== server.id);
      saveDislikedIds(nextIds);
      setDisliked(false);
      if (onUndislike) {
        onUndislike(server);
      }
      return;
    }

    setDisliked(true);
    if (!ids.includes(server.id)) {
      ids.push(server.id);
      saveDislikedIds(ids);
    }

    if (onDislike) {
      onDislike(server);
    }
  };

  const getPingBadgeColor = (latency: number) => {
    if (latency < 100) return 'pill-success';
    if (latency < 200) return 'pill-warning';
    return 'pill-danger';
  };

  return (
    <div className="tech-card">
      <div className="flex justify-between items-start mb-4 gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`tech-chip ${
            server.protocol === 'vmess' 
              ? 'chip-amber' 
              : 'chip-blue'
          }`}>
            {server.protocol?.toUpperCase() || 'VLESS'}
          </span>
          <span className="tech-chip chip-accent">
            {server.transport?.toUpperCase() || 'TCP'}
          </span>
        </div>
        <div className={`flex items-center gap-2 tech-pill ${getPingBadgeColor(server.latency || 999)}`}>
          <Zap size={16} />
          <span className="font-bold">{server.latency || 0}ms</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg tech-icon">
            <Shield size={20} />
          </div>
          <h3 className="font-semibold text-lg tech-title" title={displayName || server.ps || 'Server'}>
            {truncateServerName(displayName || server.ps || 'Server')}
          </h3>
        </div>

        <div className="text-sm font-mono mb-2 tech-muted">
          {server.add}:{server.port}
        </div>
        <div className="text-sm tech-dim">
          {server.country || 'نامشخص'} - {server.security || 'auto'}
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-sm font-medium mb-3 tech-muted">سازگاری اپراتورها</h4>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'mci', name: 'همراه اول' },
            { key: 'irancell', name: 'ایرانسل' },
            { key: 'rightel', name: 'رایتل' },
            { key: 'shatel', name: 'شاتل' },
            { key: 'mokhaberat', name: 'مخابرات' }
          ].map((operator) => {
            const isSupported = server.operators?.[operator.key as keyof typeof server.operators] || false;
            return (
              <div
                key={operator.key}
                className="flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium border"
                style={{
                  background: isSupported ? 'rgba(34, 197, 94, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                  color: isSupported ? '#22c55e' : 'var(--danger)',
                  borderColor: isSupported ? 'rgba(34, 197, 94, 0.24)' : 'rgba(244, 63, 94, 0.24)'
                }}
              >
                <span>{isSupported ? '✓' : '✕'}</span>
                <span className="truncate">{operator.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3 server-actions">
        <button 
          onClick={handleCopy}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-sm transition-colors ${
            copied
              ? 'bg-green-500 text-white'
              : 'tech-button'
          }`}
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
          <span>{copied ? 'کپی شد' : 'کپی سرور'}</span>
        </button>

        <button
          onClick={handleDislike}
          className={`px-4 py-3 flex items-center justify-center gap-2 rounded-lg font-medium text-sm transition-colors ${
            disliked ? '' : 'tech-button-ghost'
          }`}
          style={disliked ? { background: 'var(--danger)', color: '#fff' } : { color: 'var(--danger)', borderColor: 'rgba(244, 63, 94, 0.4)' }}
          title="دیسلایک"
        >
          <ThumbsDown size={16} />
          <span>{disliked ? 'دیسلایک شد' : 'دیسلایک'}</span>
        </button>
      </div>
    </div>
  );
};
