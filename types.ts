export interface ServerConfig {
  id: number;
  config_string: string;
  originalString: string;
  protocol: string;
  transport?: string;
  tls?: string;
  name: string;
  ps: string;
  address: string;
  add: string;
  port: number;
  host?: string;
  path?: string;
  country: string;
  latency: number;
  status: string;
  operators: {
    mci: boolean;
    irancell: boolean;
    rightel: boolean;
    shatel: boolean;
    mokhaberat: boolean;
  };
  packet_loss?: number;
  speed?: number;
  quality_score?: number;
  real_test_results?: string;
  reachable?: boolean;
  scanned?: boolean;
  source_id?: number;
  is_selected?: boolean;
  dislikes: number;
  created_at?: string;
  updated_at?: string;
}

export interface ScanStatus {
  isScanning: boolean;
  progress: number;
  total: number;
  tested: number;
  active: number;
  message: string;
  scanCompletedAt?: string;
  nextScanAt?: string;
  secondsUntilNextScan?: number;
}

export interface Stats {
  total_scanned: number;
  total_active: number;
  total_selected: number;
  total_dislikes: number;
  last_scan?: string;
  scan_completed_at?: string;
  next_scan_at?: string;
}