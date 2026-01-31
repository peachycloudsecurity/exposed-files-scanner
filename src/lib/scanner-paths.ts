// Git paths
export const GIT_PATH = "/.git/";
export const GIT_HEAD_PATH = GIT_PATH + "HEAD";
export const GIT_CONFIG_PATH = GIT_PATH + "config";
export const GIT_HEAD_HEADER = "ref: refs/heads/";
export const GIT_CONFIG_SEARCH = /url = (.*(github\.com|gitlab\.com).*)/;
export const GIT_OBJECTS_SEARCH = /[a-f0-9]{40}/;
export const GIT_TREE_HEADER = "tree ";
export const GIT_OBJECTS_PATH = "objects/";
export const GIT_PACK_PATH = "objects/pack/";
export const GIT_PACK_SEARCH = /pack-[a-f0-9]{40}/g;
export const GIT_PACK_EXT = ".pack";
export const GIT_IDX_EXT = ".idx";
export const SHA1_SIZE = 20;
export const GIT_BLOB_DELIMITER = String.fromCharCode(0);

export const GIT_WELL_KNOWN_PATHS = [
  "HEAD",
  "ORIG_HEAD",
  "description",
  "config",
  "COMMIT_EDITMSG",
  "index",
  "packed-refs",
  "objects/info/packs",
  "refs/heads/master",
  "refs/heads/main",
  "refs/remotes/origin/HEAD",
  "refs/stash",
  "logs/HEAD",
  "logs/refs/stash",
  "logs/refs/heads/master",
  "logs/refs/heads/main",
  "logs/refs/remotes/origin/HEAD",
  "info/refs",
  "info/exclude",
  "FETCH_HEAD",
  "MERGE_HEAD",
  "CHERRY_PICK_HEAD",
  "BISECT_LOG",
  "REBASE_HEAD",
  "refs/tags",
  "refs/remotes/origin/master",
  "refs/remotes/origin/main",
  "hooks/pre-commit",
  "hooks/post-commit",
  "hooks/pre-push",
  "modules"
];

// SVN paths
export const SVN_PATH = "/.svn/";
export const SVN_DB_PATH = SVN_PATH + "wc.db";
export const SVN_DB_HEADER = "SQLite";

// Mercurial paths
export const HG_PATH = "/.hg/";
export const HG_MANIFEST_PATH = HG_PATH + "store/00manifest.i";
export const HG_MANIFEST_HEADERS = [
  "\u0000\u0000\u0000\u0001",
  "\u0000\u0001\u0000\u0001",
  "\u0000\u0002\u0000\u0001",
  "\u0000\u0003\u0000\u0001",
];

// Environment file
export const ENV_PATH = "/.env";
export const ENV_SEARCH = /^[A-Z_]+=|^[#\n\r ][\s\S]*^[A-Z_]+=/m;

// DS_Store
export const DS_STORE_PATH = "/.DS_Store";
export const DS_STORE_HEADER = "\x00\x00\x00\x01Bud1";

// Config & backup files
export const CONFIG_PATHS = [
  "/config.php",
  "/config.php.bak",
  "/config.yml",
  "/config.json",
  "/settings.py",
  "/web.config",
  "/.htaccess",
  "/nginx.conf"
];

// Info files
export const INFO_PATHS: string[] = [];

// Debug & admin endpoints
export const DEBUG_ADMIN_PATHS = [
  "/phpinfo.php",
  "/info.php",
  "/debug",
  "/debug/",
  "/admin",
  "/administrator",
  "/actuator",
  "/actuator/health",
  "/actuator/env",
  "/actuator/heapdump",
  "/heapdump",
  "/api/swagger",
  "/swagger.json",
  "/api-docs"
];

// Backup files
export const BACKUP_PATHS = [
  "/backup",
  "/backup/",
  "/db.sql",
  "/database.sql",
  "/dump.sql",
  "/.DS_Store",
  "/Thumbs.db"
];

// Log files
export const LOG_PATHS = [
  "/logs",
  "/log",
  "/error.log",
  "/access.log",
  "/debug.log"
];

// Package manager files
export const PACKAGE_PATHS = [
  "/package.json",
  "/package-lock.json",
  "/composer.json",
  "/Gemfile",
  "/requirements.txt"
];

// API endpoints
export const API_PATHS = [
  "/rest/admin",
  "/encryptionkeys"
];

// Path categories for UI
export const PATH_CATEGORIES = {
  git: { label: 'Git Repository', paths: [GIT_HEAD_PATH] },
  svn: { label: 'SVN Repository', paths: [SVN_DB_PATH] },
  hg: { label: 'Mercurial Repository', paths: [HG_MANIFEST_PATH] },
  env: { label: 'Environment File', paths: [ENV_PATH] },
  ds_store: { label: 'DS_Store', paths: [DS_STORE_PATH] },
  config_files: { label: 'Config Files', paths: CONFIG_PATHS },
  info_files: { label: 'Info Files', paths: INFO_PATHS },
  debug_admin: { label: 'Debug/Admin', paths: DEBUG_ADMIN_PATHS },
  backup_files: { label: 'Backup Files', paths: BACKUP_PATHS },
  log_files: { label: 'Log Files', paths: LOG_PATHS },
  package_files: { label: 'Package Files', paths: PACKAGE_PATHS },
  api_endpoints: { label: 'API Endpoints', paths: API_PATHS },
};
