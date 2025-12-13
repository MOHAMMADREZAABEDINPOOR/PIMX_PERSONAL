import { ServerConfig } from '../../types.ts';

// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.MODE === 'production' ? '/api' : 'http://localhost:3001/api'
);

export const apiService = {
  // دریافت سرورهای فعال
  async getActiveServers(): Promise<ServerConfig[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/servers`);
      if (!response.ok) {
        throw new Error('خطا در دریافت سرورها');
      }
      const data = await response.json();
      
      // تبدیل داده‌های دیتابیس به فرمت فرانت‌اند
      return data.map((server: any) => ({
        id: server.id,
        config_string: server.config_string,
        originalString: server.config_string,
        protocol: server.protocol,
        transport: server.transport || 'tcp',
        tls: server.tls || '',
        name: server.name,
        ps: server.name,
        address: server.address,
        add: server.address,
        port: server.port,
        host: server.host || server.address,
        path: server.path || '/',
        country: server.country,
        latency: server.latency,
        status: server.status,
        operators: server.operators,
        packet_loss: server.packet_loss,
        speed: server.speed,
        quality_score: server.quality_score,
        real_test_results: server.real_test_results,
        reachable: server.reachable,
        scanned: server.scanned,
        source_id: server.source_id,
        is_selected: server.is_selected,
        dislikes: server.dislikes,
        created_at: server.created_at,
        updated_at: server.updated_at
      }));
    } catch (error) {
      console.error('خطا در دریافت سرورها:', error);
      throw error;
    }
  },

  // دریافت آمار
  async getStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/stats`);
      if (!response.ok) {
        throw new Error('خطا در دریافت آمار');
      }
      return await response.json();
    } catch (error) {
      console.error('خطا در دریافت آمار:', error);
      throw error;
    }
  },

  // ثبت دیسلایک
  async dislikeServer(serverId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/servers/${serverId}/dislike`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('خطا در ثبت دیسلایک');
      }
      
      return await response.json();
    } catch (error) {
      console.error('خطا در ثبت دیسلایک:', error);
      throw error;
    }
  },

  // دریافت وضعیت اسکن
  async getScanStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/scan-status`);
      if (!response.ok) {
        throw new Error('خطا در دریافت وضعیت اسکن');
      }
      return await response.json();
    } catch (error) {
      console.error('خطا در دریافت وضعیت اسکن:', error);
      return {
        isScanning: false,
        progress: 0,
        total: 0,
        tested: 0,
        active: 0,
        message: 'نامشخص'
      };
    }
  },


};