export interface ScanOptions {
  functions: {
    git: boolean;
    svn: boolean;
    hg: boolean;
    env: boolean;
    ds_store: boolean;
    config_files: boolean;
    info_files: boolean;
    debug_admin: boolean;
    backup_files: boolean;
    log_files: boolean;
    package_files: boolean;
    api_endpoints: boolean;
  };
  timeout: number;
  maxConnections: number;
}

export interface ScanResult {
  id: string;
  domain: string;
  type: FindingType;
  path: string;
  status: 'success' | 'error' | 'timeout';
  content?: string;
  contentSize?: number;
  foundAt: string;
  isOpenSource?: boolean;
}

export type FindingType = 
  | 'git'
  | 'svn'
  | 'hg'
  | 'env'
  | 'ds_store'
  | 'config'
  | 'info'
  | 'debug'
  | 'backup'
  | 'log'
  | 'package'
  | 'api';

export interface ScanProgress {
  total: number;
  completed: number;
  findings: number;
  currentDomain: string;
  status: 'idle' | 'scanning' | 'completed' | 'cancelled';
  estimatedTimeRemaining: number;
}

export interface DownloadProgress {
  url: string;
  successful: number;
  failed: number;
  total: number;
  status: 'downloading' | 'creating_zip' | 'completed' | 'failed';
}

// Default configuration constants
export const DEFAULT_TIMEOUT_MS = 5000; // 5 seconds
export const DEFAULT_MAX_CONNECTIONS = 20;

export const DEFAULT_SCAN_OPTIONS: ScanOptions = {
  functions: {
    git: true,
    svn: true,
    hg: true,
    env: true,
    ds_store: true,
    config_files: true,
    info_files: true,
    debug_admin: true,
    backup_files: true,
    log_files: true,
    package_files: true,
    api_endpoints: true,
  },
  timeout: DEFAULT_TIMEOUT_MS,
  maxConnections: DEFAULT_MAX_CONNECTIONS,
};

export const FINDING_TYPE_LABELS: Record<FindingType, string> = {
  git: 'Git Repository',
  svn: 'SVN Repository',
  hg: 'Mercurial Repository',
  env: 'Environment File',
  ds_store: 'DS_Store',
  config: 'Config File',
  info: 'Info File',
  debug: 'Debug/Admin',
  backup: 'Backup File',
  log: 'Log File',
  package: 'Package File',
  api: 'API Endpoint',
};

export const FINDING_TYPE_COLORS: Record<FindingType, string> = {
  git: 'bg-orange-100 text-orange-800',
  svn: 'bg-blue-100 text-blue-800',
  hg: 'bg-purple-100 text-purple-800',
  env: 'bg-red-100 text-red-800',
  ds_store: 'bg-gray-100 text-gray-800',
  config: 'bg-yellow-100 text-yellow-800',
  info: 'bg-green-100 text-green-800',
  debug: 'bg-pink-100 text-pink-800',
  backup: 'bg-indigo-100 text-indigo-800',
  log: 'bg-cyan-100 text-cyan-800',
  package: 'bg-emerald-100 text-emerald-800',
  api: 'bg-rose-100 text-rose-800',
};
