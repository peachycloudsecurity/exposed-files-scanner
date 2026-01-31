import JSZip from 'jszip';
import pako from 'pako';
import { saveAs } from 'file-saver';
import type { ScanOptions, ScanResult, FindingType, ScanProgress } from './scanner-types';
import {
  GIT_PATH,
  GIT_HEAD_PATH,
  GIT_CONFIG_PATH,
  GIT_HEAD_HEADER,
  GIT_OBJECTS_SEARCH,
  GIT_WELL_KNOWN_PATHS,
  SVN_DB_PATH,
  SVN_DB_HEADER,
  HG_MANIFEST_PATH,
  HG_MANIFEST_HEADERS,
  ENV_PATH,
  ENV_SEARCH,
  DS_STORE_PATH,
  DS_STORE_HEADER,
  CONFIG_PATHS,
  INFO_PATHS,
  DEBUG_ADMIN_PATHS,
  BACKUP_PATHS,
  LOG_PATHS,
  PACKAGE_PATHS,
  API_PATHS,
  GIT_CONFIG_SEARCH,
  GIT_TREE_HEADER,
  GIT_OBJECTS_PATH,
  GIT_PACK_PATH,
  GIT_PACK_SEARCH,
  GIT_PACK_EXT,
  GIT_IDX_EXT,
  SHA1_SIZE,
  GIT_BLOB_DELIMITER,
} from './scanner-paths';

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

// Fetch with timeout
async function fetchWithTimeout(
  url: string,
  timeout: number = 5000
): Promise<Response | null> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      redirect: 'manual',
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    return null;
  }
}

// Read response text with timeout
async function readResponseTextWithTimeout(
  response: Response,
  timeout: number = 5000
): Promise<string> {
  return Promise.race([
    response.text(),
    new Promise<string>((_, reject) => 
      setTimeout(() => reject(new Error('Response body read timeout')), timeout)
    )
  ]);
}

// Read response arrayBuffer with timeout
async function readResponseArrayBufferWithTimeout(
  response: Response,
  timeout: number = 5000
): Promise<ArrayBuffer> {
  return Promise.race([
    response.arrayBuffer(),
    new Promise<ArrayBuffer>((_, reject) => 
      setTimeout(() => reject(new Error('Response body read timeout')), timeout)
    )
  ]);
}

// Normalize URL
function normalizeUrl(input: string): string {
  let url = input.trim();
  
  // Remove trailing slash
  url = url.replace(/\/+$/, '');
  
  // Add protocol if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  try {
    const parsed = new URL(url);
    return parsed.origin;
  } catch {
    return '';
  }
}

// Check for exposed Git repository
async function checkGit(baseUrl: string, timeout: number): Promise<boolean> {
  // First check .git/HEAD
  const headUrl = baseUrl + GIT_HEAD_PATH;
  let headIsValid = false;
  
  try {
    const response = await fetchWithTimeout(headUrl, timeout);
    
    if (response && response.status === 200) {
      const contentType = response.headers.get('content-type') || '';
      const text = await readResponseTextWithTimeout(response, timeout);
      
      // False positive detection: if response is HTML, it's likely not a real Git HEAD file
      const isHtmlResponse = contentType.includes('text/html') || 
                             text.toLowerCase().includes('<!doctype') ||
                             text.toLowerCase().includes('<html') ||
                             text.toLowerCase().includes('<!DOCTYPE');
      
      if (!isHtmlResponse) {
      // Check if it starts with ref: refs/heads/ or contains a SHA1 hash
      if (text.startsWith(GIT_HEAD_HEADER) || GIT_OBJECTS_SEARCH.test(text)) {
        return true;
        }
      }
    }
  } catch {
    // Ignore errors, continue to check config
  }
  
  // Fallback: Check .git/config if HEAD is not accessible or invalid
  const configUrl = baseUrl + GIT_CONFIG_PATH;
  
  try {
    const response = await fetchWithTimeout(configUrl, timeout);
    
    if (response && response.status === 200) {
      const contentType = response.headers.get('content-type') || '';
      const text = await readResponseTextWithTimeout(response, timeout);
      
      // False positive detection: if response is HTML, it's likely not a real Git config file
      const isHtmlResponse = contentType.includes('text/html') || 
                             text.toLowerCase().includes('<!doctype') ||
                             text.toLowerCase().includes('<html') ||
                             text.toLowerCase().includes('<!DOCTYPE');
      
      if (!isHtmlResponse) {
        // Check if it's a valid Git config file
        // Git config files typically contain [core], [remote], or [branch] sections
        if (text.includes('[core]') || 
            text.includes('[remote]') || 
            text.includes('[branch]') ||
            GIT_CONFIG_SEARCH.test(text)) {
          return true;
        }
      }
    }
  } catch {
    // Ignore errors
  }
  
  return false;
}

// Check for exposed SVN repository
async function checkSvn(baseUrl: string, timeout: number): Promise<boolean> {
  const url = baseUrl + SVN_DB_PATH;
  
  try {
    const response = await fetchWithTimeout(url, timeout);
    
    if (response && response.status === 200) {
      const contentType = response.headers.get('content-type') || '';
      const text = await readResponseTextWithTimeout(response, timeout);
      
      // False positive detection: if response is HTML, it's likely not a real SVN database
      const isHtmlResponse = contentType.includes('text/html') || 
                             text.toLowerCase().includes('<!doctype') ||
                             text.toLowerCase().includes('<html') ||
                             text.toLowerCase().includes('<!DOCTYPE');
      
      if (isHtmlResponse) {
        return false; // False positive - HTML response for SVN database
      }
      
      if (text.startsWith(SVN_DB_HEADER)) {
        return true;
      }
    }
  } catch {
    // Ignore errors
  }
  
  return false;
}

// Check for exposed Mercurial repository
async function checkHg(baseUrl: string, timeout: number): Promise<boolean> {
  const url = baseUrl + HG_MANIFEST_PATH;
  
  try {
    const response = await fetchWithTimeout(url, timeout);
    
    if (response && response.status === 200) {
      const contentType = response.headers.get('content-type') || '';
      const text = await readResponseTextWithTimeout(response, timeout);
      
      // False positive detection: if response is HTML, it's likely not a real Mercurial manifest
      const isHtmlResponse = contentType.includes('text/html') || 
                             text.toLowerCase().includes('<!doctype') ||
                             text.toLowerCase().includes('<html') ||
                             text.toLowerCase().includes('<!DOCTYPE');
      
      if (isHtmlResponse) {
        return false; // False positive - HTML response for Mercurial manifest
      }
      
      if (HG_MANIFEST_HEADERS.some(header => text.startsWith(header))) {
        return true;
      }
    }
  } catch {
    // Ignore errors
  }
  
  return false;
}

// Check for exposed .env file
async function checkEnv(baseUrl: string, timeout: number): Promise<boolean> {
  const url = baseUrl + ENV_PATH;
  
  try {
    const response = await fetchWithTimeout(url, timeout);
    
    if (response && response.status === 200) {
      const contentType = response.headers.get('content-type') || '';
      
      // False positive detection: if response is HTML, it's likely not a real .env file
      // For .env files, we only need to check if it exists (200 status) and is not HTML
      if (contentType.includes('text/html')) {
        return false; // False positive - HTML response for .env file
      }
      
      // If file exists (200) and is not HTML, it's a valid .env file
        return true;
    }
  } catch {
    // Ignore errors
  }
  
  return false;
}

// Check for exposed .DS_Store file
async function checkDsStore(baseUrl: string, timeout: number): Promise<boolean> {
  const url = baseUrl + DS_STORE_PATH;
  
  try {
    const response = await fetchWithTimeout(url, timeout);
    
    if (response && response.status === 200) {
      const contentType = response.headers.get('content-type') || '';
      const text = await readResponseTextWithTimeout(response, timeout);
      
      // False positive detection: if response is HTML, it's likely not a real DS_Store file
      const isHtmlResponse = contentType.includes('text/html') || 
                             text.toLowerCase().includes('<!doctype') ||
                             text.toLowerCase().includes('<html') ||
                             text.toLowerCase().includes('<!DOCTYPE');
      
      if (isHtmlResponse) {
        return false; // False positive - HTML response for DS_Store file
      }
      
      if (text.startsWith(DS_STORE_HEADER)) {
        return true;
        }
      }
    } catch {
      // Ignore errors
  }
  
  return false;
}

// Check if repository is open source
async function checkOpenSource(baseUrl: string, timeout: number): Promise<string | false> {
  const configUrl = baseUrl + GIT_CONFIG_PATH;
  
  try {
    const response = await fetchWithTimeout(configUrl, timeout);
    
    if (response && response.status === 200) {
      const text = await readResponseTextWithTimeout(response, timeout);
      const match = GIT_CONFIG_SEARCH.exec(text);
      
      if (match) {
        let repoUrl = match[1]
          .replace('github.com:', 'github.com/')
          .replace('gitlab.com:', 'gitlab.com/');
        
        if (repoUrl.startsWith('ssh://')) {
          repoUrl = repoUrl.substring(6);
        }
        if (repoUrl.startsWith('git@')) {
          repoUrl = repoUrl.substring(4);
        }
        if (repoUrl.endsWith('.git')) {
          repoUrl = repoUrl.substring(0, repoUrl.length - 4);
        }
        if (!repoUrl.startsWith('http')) {
          repoUrl = 'https://' + repoUrl;
        }
        
        try {
          new URL(repoUrl);
          const checkResponse = await fetchWithTimeout(repoUrl, timeout);
          if (checkResponse && checkResponse.status === 200) {
            return repoUrl;
          }
        } catch {
          // Invalid URL
        }
      }
    }
  } catch {
    // Ignore errors
  }
  
  return false;
}

// Check generic path with content validation
async function checkPath(
  baseUrl: string,
  path: string,
  timeout: number
): Promise<{ found: boolean; size?: number }> {
  const url = baseUrl + path;
  
  try {
    const response = await fetchWithTimeout(url, timeout);
    
    if (!response) {
      return { found: false };
    }
    
    // Handle redirects explicitly - don't read headers for redirects to avoid CORS errors
    const status = response.status;
    if (status >= 300 && status < 400) {
      // Redirect response - don't try to read headers/body (avoids CORS console errors)
      return { found: false };
    }
    
    if (status !== 200) {
      return { found: false };
    }
    
    // Check Content-Type FIRST (before reading body) - catches HTML even if CORS blocks
    // Note: Content-Type is a CORS-safelisted header, so we can always read it
    const contentType = response.headers.get('content-type') || '';
      const contentLength = response.headers.get('content-length');
      const size = contentLength ? parseInt(contentLength, 10) : undefined;
    
    // Determine expected file type from path
    const fileExtension = path.split('.').pop()?.toLowerCase() || '';
    const fileName = path.split('/').pop()?.toLowerCase() || '';
    
    // For non-HTML file types, reject immediately if Content-Type is HTML
    const shouldNotBeHtml = fileExtension && !['html', 'htm'].includes(fileExtension) ||
                           fileName && !['index.html', 'index.htm'].includes(fileName) ||
                           path.includes('.json') || path.includes('.lock') || 
                           path.includes('.txt') || path.includes('.yml') ||
                           path.includes('.yaml') || path.includes('.env') ||
                           path.includes('actuator') || path.includes('/api/');
    
    if (shouldNotBeHtml && contentType.includes('text/html')) {
      // Reject HTML Content-Type for non-HTML file types (SPA routing false positive)
      return { found: false };
    }
    
    // Try to read response body (may fail due to CORS or timeout)
    let text = '';
    let contentSample = '';
    let corsBlocked = false;
    try {
      text = await readResponseTextWithTimeout(response, timeout);
      contentSample = text.substring(0, 1000).toLowerCase();
    } catch (e) {
      // Check if this is a CORS error specifically
      corsBlocked = (e instanceof TypeError && 
                    (e.message.includes('Failed to fetch') || 
                     e.message.includes('NetworkError') ||
                     e.message.includes('CORS'))) ||
                    (e instanceof DOMException && e.name === 'NetworkError');
      
      if (!corsBlocked) {
        // Not a CORS error - some other network issue, treat as not found
        return { found: false };
      }
      
      // CORS blocked - can't read body
      // Without body validation, we can't be confident it's a real finding
      // Only report if Content-Type strongly suggests it's valid AND we have size info
      if (shouldNotBeHtml && !contentType.includes('text/html') && size && size > 0) {
        // Content-Type suggests it's not HTML, and we have size info
        // But we can't validate content, so be VERY conservative
        // Only report if Content-Type matches expected file type
        const contentTypeMatches = 
          (fileExtension === 'json' && contentType.includes('json')) ||
          (fileExtension === 'txt' && contentType.includes('text/plain')) ||
          (fileExtension === 'yml' || fileExtension === 'yaml') && contentType.includes('yaml') ||
          (path.includes('.env') && contentType.includes('text/plain')) ||
          (path.includes('actuator') && contentType.includes('json'));
        
        if (contentTypeMatches) {
          // Content-Type matches expected type - likely valid, but unverified
          return { found: true, size };
        }
      }
      
      // CORS blocked and we can't validate - don't report as finding
      return { found: false };
    }
    
    // Check if response is HTML when it shouldn't be (false positive detection)
    const isHtmlResponse = contentType.includes('text/html') || 
                             contentSample.includes('<!doctype') ||
                             contentSample.includes('<html') ||
                             contentSample.includes('<!DOCTYPE') ||
                             // SPA detection: React/Vue/Angular markers
                             contentSample.includes('react') ||
                             contentSample.includes('react-dom') ||
                             contentSample.includes('__reactroot') ||
                             contentSample.includes('vue') ||
                             contentSample.includes('ng-app') ||
                             contentSample.includes('app-root') ||
                             (contentSample.includes('root') && contentSample.includes('script'));
    
    // Validate based on file type
    let isValid = true;
    
    // For .env files - should have KEY=VALUE format, not HTML
    if (path.includes('.env') || fileName === '.env') {
      if (isHtmlResponse) {
        isValid = false;
      } else {
        // Check for environment variable pattern
        const envPattern = /^[A-Z_][A-Z0-9_]*\s*=/m;
        isValid = envPattern.test(text);
      }
    }
    // For PHP files - should have PHP code, not HTML
    else if (fileExtension === 'php' || path.includes('.php')) {
      if (isHtmlResponse && !contentSample.includes('<?php') && !contentSample.includes('<?=')) {
        isValid = false;
      }
    }
    // For config files - should not be HTML
    else if (path.includes('config') || fileName.includes('config') || fileExtension === 'conf') {
      if (isHtmlResponse) {
        // web.config can be XML, but if it's HTML it's likely false positive
        if (path.includes('web.config')) {
          // web.config should be XML, not HTML
          isValid = contentSample.includes('<?xml') || contentSample.includes('<configuration');
        } else {
          // Other config files should not be HTML
          isValid = false;
        }
      } else {
        // Non-HTML config files - validate they have config-like content
        if (fileExtension === 'conf' || fileName.includes('nginx') || fileName.includes('apache')) {
          isValid = contentSample.includes('server') || 
                   contentSample.includes('location') || 
                   contentSample.includes('proxy') ||
                   contentSample.includes('listen');
        }
      }
    }
    // For .htaccess - should have Apache directives, not HTML
    else if (path.includes('.htaccess') || fileName === '.htaccess') {
      if (isHtmlResponse) {
        isValid = false;
      } else {
        // Check for Apache directives
        const htaccessPattern = /^(RewriteRule|RewriteCond|Directory|Options|Allow|Deny|Order)/m;
        isValid = htaccessPattern.test(text) || text.trim().length < 100;
      }
    }
    // For .bak files - should not be HTML
    else if (fileExtension === 'bak' || path.includes('.bak')) {
      if (isHtmlResponse) {
        isValid = false;
      }
    }
    // For SQL files - should have SQL syntax, not HTML
    else if (fileExtension === 'sql' || path.includes('.sql')) {
      if (isHtmlResponse) {
        isValid = false;
      } else {
        // Check for SQL keywords
        const sqlPattern = /^(CREATE|INSERT|UPDATE|DELETE|SELECT|DROP|ALTER|USE|SHOW)/m;
        isValid = sqlPattern.test(text);
      }
    }
    // For YAML/JSON files - should be valid YAML/JSON, not HTML
    else if (fileExtension === 'yml' || fileExtension === 'yaml' || fileExtension === 'json' || 
             fileName === 'package.json' || fileName === 'package-lock.json' || 
             fileName === 'composer.json') {
      if (isHtmlResponse) {
        isValid = false;
      } else {
        // Try to parse as JSON if .json
        if (fileExtension === 'json' || fileName.includes('.json')) {
          try {
            JSON.parse(text);
            isValid = true;
          } catch {
            isValid = false;
          }
        } else {
          // For YAML, check for YAML-like structure
          isValid = contentSample.includes('version:') || 
                   contentSample.includes('dependencies:') ||
                   contentSample.includes('name:') ||
                   !isHtmlResponse;
        }
      }
    }
    // For log files - should be plain text, not HTML
    else if (path.includes('.log') || fileName.includes('log')) {
      if (isHtmlResponse) {
        isValid = false;
      }
    }
    // For Python files - should have Python code, not HTML
    else if (fileExtension === 'py' || path.includes('.py')) {
      if (isHtmlResponse && !contentSample.includes('import ') && !contentSample.includes('def ') && !contentSample.includes('class ')) {
        isValid = false;
      }
    }
    // For package files - should be JSON or have package syntax
    else if (fileName === 'package.json' || fileName === 'composer.json' || fileName === 'requirements.txt' || fileName === 'gemfile') {
      if (isHtmlResponse) {
        isValid = false;
      }
    }
    // For info files (robots.txt, sitemap.xml, etc.) - validate content
    else if (fileName === 'robots.txt') {
      if (isHtmlResponse) {
        isValid = false;
      } else {
        // robots.txt should have User-agent or similar
        isValid = /^(User-agent|Disallow|Allow|Sitemap|Crawl-delay)/m.test(text);
      }
    }
    else if (fileName === 'sitemap.xml' || path.includes('sitemap')) {
      if (isHtmlResponse) {
        isValid = false;
      } else {
        // Should have XML structure
        isValid = contentSample.includes('<?xml') || contentSample.includes('<urlset') || contentSample.includes('<sitemap');
      }
    }
    // For XML info files (crossdomain.xml, clientaccesspolicy.xml)
    else if (fileName === 'crossdomain.xml' || fileName === 'clientaccesspolicy.xml') {
      if (isHtmlResponse) {
        isValid = false;
      } else {
        // Should have XML structure
        isValid = contentSample.includes('<?xml') || 
                 contentSample.includes('<cross-domain-policy') || 
                 contentSample.includes('<access-policy') ||
                 contentSample.includes('<allow-access-from');
      }
    }
    // For Spring Boot actuator endpoints - should return JSON, not HTML 404
    else if (path.includes('actuator')) {
      // Actuator endpoints MUST return JSON, never HTML
      if (isHtmlResponse || contentType.includes('text/html')) {
        isValid = false; // Always reject HTML for actuator endpoints
      } else {
        // Non-HTML response for actuator is likely valid JSON
        isValid = true;
      }
    }
    // For debug/admin endpoints - validate it's actually a debug page, not SPA routing
    else if (path.includes('debug') || path.includes('admin') || path.includes('phpinfo') || path.includes('info.php')) {
      if (isHtmlResponse) {
        // Check if it's a 404 page or SPA routing
        const is404Page = contentSample.includes('404') || 
                         contentSample.includes('not found') ||
                         contentSample.includes('page not found') ||
                         contentSample.includes('oops') ||
                         contentSample.includes('return to home');
        
        const isSpaPage = contentSample.includes('react') || 
                         contentSample.includes('angular') || 
                         contentSample.includes('vue') || 
                         contentSample.includes('app-root') ||
                         (size && size > 50000); // Large HTML likely SPA
        
        if (is404Page || isSpaPage) {
          // Must contain actual debug/admin content, not just SPA routing or 404
          isValid = contentSample.includes('phpinfo') || 
                   contentSample.includes('php version') ||
                   contentSample.includes('php configuration') ||
                   contentSample.includes('system information') ||
                   contentSample.includes('environment variables') ||
                   contentSample.includes('$_server') ||
                   contentSample.includes('$_env') ||
                   (path.includes('phpinfo') && contentSample.includes('php'));
          
          // If it's a 404 page, it's definitely false positive
          if (is404Page) {
            isValid = false;
          }
        } else {
          // Small HTML response might be a real debug page
          isValid = true;
        }
      }
    }
    // For backup paths - should not be HTML 404 pages
    else if (path.includes('/backup') || fileName === 'backup') {
      if (isHtmlResponse) {
        // Check if it's a 404 page or SPA routing
        const is404Page = contentSample.includes('404') || 
                         contentSample.includes('not found') ||
                         contentSample.includes('page not found') ||
                         contentSample.includes('oops') ||
                         contentSample.includes('return to home');
        
        const isSpaPage = contentSample.includes('react') || 
                         contentSample.includes('angular') || 
                         contentSample.includes('vue') || 
                         contentSample.includes('app-root');
        
        // Backup paths should not be HTML 404 pages
        if (is404Page || isSpaPage) {
          isValid = false;
        } else {
          // If it's HTML but not 404, it might be a directory listing or backup page
          // Check for backup-related content
          isValid = contentSample.includes('backup') || 
                   contentSample.includes('directory listing') ||
                   contentSample.includes('index of') ||
                   contentSample.includes('file list');
        }
      } else {
        // Non-HTML response for backup is likely valid (could be a file or directory listing)
        isValid = true;
      }
    }
    // For API endpoints - should return JSON/XML, not HTML (unless it's a Swagger UI)
    else if (path.includes('/api') || path.includes('/rest') || path.includes('/ftp') || path.includes('/encryptionkeys')) {
      if (isHtmlResponse) {
        // Check if it's Swagger UI (legitimate HTML for API docs)
        if (path.includes('swagger') || path.includes('api-docs')) {
          isValid = contentSample.includes('swagger') || 
                   contentSample.includes('openapi') ||
                   contentSample.includes('api documentation');
        } else {
          // For other API endpoints, HTML is likely SPA routing (false positive)
          const isSpaPage = contentSample.includes('react') || 
                           contentSample.includes('angular') || 
                           contentSample.includes('vue') || 
                           contentSample.includes('app-root');
          isValid = !isSpaPage; // Only valid if not SPA
        }
      } else {
        // Non-HTML response for API is likely valid
        isValid = true;
      }
    }
    
    // Catch-all: If it's HTML and we haven't determined it's valid, check for SPA patterns
    if (isHtmlResponse && isValid) {
      // Double-check: if it looks like an SPA page and the file shouldn't be HTML, reject it
      const isSpaPage = contentSample.includes('react') || 
                       contentSample.includes('angular') || 
                       contentSample.includes('vue') || 
                       contentSample.includes('app-root') ||
                       contentSample.includes('root') ||
                       (size && size > 50000);
      
      // If it's an SPA page and the file extension/path suggests it shouldn't be HTML, reject
      if (isSpaPage && fileExtension && !['html', 'htm'].includes(fileExtension)) {
        // Check if path suggests it should be a specific file type
        if (path.includes('.') || fileName.includes('.')) {
          isValid = false;
        }
      }
    }
    
    // If it's HTML and we determined it shouldn't be, it's a false positive
    if (isHtmlResponse && !isValid) {
      return { found: false };
    }
    
    return { found: isValid, size };
  } catch {
    // Ignore errors
  }
  
  return { found: false };
}

// Map path to finding type
function getTypeFromPath(path: string): FindingType {
  if (path.includes('.git')) return 'git';
  if (path.includes('.svn')) return 'svn';
  if (path.includes('.hg')) return 'hg';
  if (path.includes('.env')) return 'env';
  if (path.includes('.DS_Store')) return 'ds_store';
  if (CONFIG_PATHS.some(p => path.includes(p))) return 'config';
  if (INFO_PATHS.some(p => path.includes(p))) return 'info';
  if (DEBUG_ADMIN_PATHS.some(p => path.includes(p))) return 'debug';
  if (BACKUP_PATHS.some(p => path.includes(p))) return 'backup';
  if (LOG_PATHS.some(p => path.includes(p))) return 'log';
  if (PACKAGE_PATHS.some(p => path.includes(p))) return 'package';
  if (API_PATHS.some(p => path.includes(p))) return 'api';
  return 'config';
}

// Main scanning function
export async function scanDomains(
  domains: string[],
  options: ScanOptions,
  onProgress: (progress: ScanProgress) => void,
  onResult: (result: ScanResult) => void,
  abortSignal?: AbortSignal
): Promise<ScanResult[]> {
  const results: ScanResult[] = [];
  const startTime = Date.now();
  
  // Normalize all domains
  const normalizedDomains = domains
    .map(normalizeUrl)
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates
  
  const progress: ScanProgress = {
    total: normalizedDomains.length,
    completed: 0,
    findings: 0,
    currentDomain: '',
    status: 'scanning',
    estimatedTimeRemaining: 0,
  };
  
  onProgress({ ...progress });
  
  // Process domains in batches
  const batchSize = options.maxConnections;
  
  for (let i = 0; i < normalizedDomains.length; i += batchSize) {
    if (abortSignal?.aborted) {
      progress.status = 'cancelled';
      onProgress({ ...progress });
      break;
    }
    
    const batch = normalizedDomains.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(async (domain) => {
        if (abortSignal?.aborted) return;
        
        progress.currentDomain = domain;
        
        // Run all version control checks in parallel (like extension)
        // Only check if the function is enabled in options
        const [isGit, isSvn, isHg, isEnv, isDsStore] = await Promise.all([
          options?.functions?.git ? checkGit(domain, options.timeout) : Promise.resolve(false),
          options?.functions?.svn ? checkSvn(domain, options.timeout) : Promise.resolve(false),
          options?.functions?.hg ? checkHg(domain, options.timeout) : Promise.resolve(false),
          options?.functions?.env ? checkEnv(domain, options.timeout) : Promise.resolve(false),
          options?.functions?.ds_store ? checkDsStore(domain, options.timeout) : Promise.resolve(false),
        ]);
        
        // Process results
          if (isGit) {
            const result: ScanResult = {
              id: generateId(),
              domain,
              type: 'git',
              path: GIT_HEAD_PATH,
              status: 'success',
              foundAt: domain + GIT_HEAD_PATH,
            };
            results.push(result);
            onResult(result);
            progress.findings++;
        }
        
          if (isSvn) {
            const result: ScanResult = {
              id: generateId(),
              domain,
              type: 'svn',
              path: SVN_DB_PATH,
              status: 'success',
              foundAt: domain + SVN_DB_PATH,
            };
            results.push(result);
            onResult(result);
            progress.findings++;
        }
        
          if (isHg) {
            const result: ScanResult = {
              id: generateId(),
              domain,
              type: 'hg',
              path: HG_MANIFEST_PATH,
              status: 'success',
              foundAt: domain + HG_MANIFEST_PATH,
            };
            results.push(result);
            onResult(result);
            progress.findings++;
        }
        
          if (isEnv) {
            const result: ScanResult = {
              id: generateId(),
              domain,
              type: 'env',
              path: ENV_PATH,
              status: 'success',
              foundAt: domain + ENV_PATH,
            };
            results.push(result);
            onResult(result);
            progress.findings++;
        }
        
          if (isDsStore) {
            const result: ScanResult = {
              id: generateId(),
              domain,
              type: 'ds_store',
              path: DS_STORE_PATH,
              status: 'success',
              foundAt: domain + DS_STORE_PATH,
            };
            results.push(result);
            onResult(result);
            progress.findings++;
        }
        
        // Check all paths in parallel for better performance
        const pathChecks: Promise<void>[] = [];
        
        // Check config files
        if (options?.functions?.config_files) {
          CONFIG_PATHS.forEach(path => {
            pathChecks.push(
              checkPath(domain, path, options.timeout).then(({ found, size }) => {
                if (found && !abortSignal?.aborted) {
              const result: ScanResult = {
                id: generateId(),
                domain,
                type: 'config',
                path,
                status: 'success',
                foundAt: domain + path,
                contentSize: size,
              };
              results.push(result);
              onResult(result);
              progress.findings++;
            }
              })
            );
          });
        }
        
        // Check info files
        if (options?.functions?.info_files) {
          INFO_PATHS.forEach(path => {
            pathChecks.push(
              checkPath(domain, path, options.timeout).then(({ found, size }) => {
                if (found && !abortSignal?.aborted) {
              const result: ScanResult = {
                id: generateId(),
                domain,
                type: 'info',
                path,
                status: 'success',
                foundAt: domain + path,
                contentSize: size,
              };
              results.push(result);
              onResult(result);
              progress.findings++;
            }
              })
            );
          });
        }
        
        // Check debug/admin endpoints
        if (options?.functions?.debug_admin) {
          DEBUG_ADMIN_PATHS.forEach(path => {
            pathChecks.push(
              checkPath(domain, path, options.timeout).then(({ found, size }) => {
                if (found && !abortSignal?.aborted) {
              const result: ScanResult = {
                id: generateId(),
                domain,
                type: 'debug',
                path,
                status: 'success',
                foundAt: domain + path,
                contentSize: size,
              };
              results.push(result);
              onResult(result);
              progress.findings++;
            }
              })
            );
          });
        }
        
        // Check backup files
        if (options?.functions?.backup_files) {
          BACKUP_PATHS.forEach(path => {
            pathChecks.push(
              checkPath(domain, path, options.timeout).then(({ found, size }) => {
                if (found && !abortSignal?.aborted) {
              const result: ScanResult = {
                id: generateId(),
                domain,
                type: 'backup',
                path,
                status: 'success',
                foundAt: domain + path,
                contentSize: size,
              };
              results.push(result);
              onResult(result);
              progress.findings++;
            }
              })
            );
          });
        }
        
        // Check log files
        if (options?.functions?.log_files) {
          LOG_PATHS.forEach(path => {
            pathChecks.push(
              checkPath(domain, path, options.timeout).then(({ found, size }) => {
                if (found && !abortSignal?.aborted) {
              const result: ScanResult = {
                id: generateId(),
                domain,
                type: 'log',
                path,
                status: 'success',
                foundAt: domain + path,
                contentSize: size,
              };
              results.push(result);
              onResult(result);
              progress.findings++;
            }
              })
            );
          });
        }
        
        // Check package files
        if (options?.functions?.package_files) {
          PACKAGE_PATHS.forEach(path => {
            pathChecks.push(
              checkPath(domain, path, options.timeout).then(({ found, size }) => {
                if (found && !abortSignal?.aborted) {
              const result: ScanResult = {
                id: generateId(),
                domain,
                type: 'package',
                path,
                status: 'success',
                foundAt: domain + path,
                contentSize: size,
              };
              results.push(result);
              onResult(result);
              progress.findings++;
            }
              })
            );
          });
        }
        
        // Check API endpoints
        if (options?.functions?.api_endpoints) {
          API_PATHS.forEach(path => {
            pathChecks.push(
              checkPath(domain, path, options.timeout).then(({ found, size }) => {
                if (found && !abortSignal?.aborted) {
              const result: ScanResult = {
                id: generateId(),
                domain,
                type: 'api',
                path,
                status: 'success',
                foundAt: domain + path,
                contentSize: size,
              };
              results.push(result);
              onResult(result);
              progress.findings++;
            }
              })
            );
          });
        }
        
        // Wait for all path checks to complete
        await Promise.all(pathChecks);
        
        progress.completed++;
        
        // Calculate estimated time remaining
        const elapsed = Date.now() - startTime;
        const avgTimePerDomain = elapsed / progress.completed;
        const remaining = progress.total - progress.completed;
        progress.estimatedTimeRemaining = Math.round((avgTimePerDomain * remaining) / 1000);
        
        onProgress({ ...progress });
      })
    );
    
    // Small delay between batches
    if (i + batchSize < normalizedDomains.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  if (!abortSignal?.aborted) {
    progress.status = 'completed';
    progress.currentDomain = '';
    onProgress({ ...progress });
  }
  
  return results;
}

// Download Git repository
export async function downloadGitRepo(
  baseUrl: string,
  onProgress?: (progress: { successful: number; failed: number; total: number }) => void
): Promise<void> {
  const zip = new JSZip();
  const downloadedFiles: [string, ArrayBuffer][] = [];
  const walkedPaths = new Set<string>();
  const downloadStats: Record<number, number> = {};
  const downloadStatus = { successful: 0, failed: 0, total: 0 };
  
  const maxConnections = 20;
  const wait = 100;
  const maxWait = 10000;
  const failedInARow = 250;
  let runningTasks = 0;
  let waiting = 0;
  let fileExist = false;
  let failedCount = 0;
  let zipCreated = false;
  let discoveryActive = true; // Track if we're still discovering new objects
  let lastDiscoveryTime = Date.now();
  const discoveryTimeout = 10000; // Wait 10 seconds after last discovery before finalizing (increased for large repos)
  let discoveryTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let resolvePromise: (() => void) | null = null;
  const downloadPromise = new Promise<void>((resolve) => {
    resolvePromise = resolve;
  });
  
  const arrayBufferToString = (buffer: Uint8Array): string => {
    let result = '';
    buffer.forEach(part => {
      result += String.fromCharCode(part);
    });
    return result;
  };
  
  // Convert binary SHA1 (20 bytes) to hex string
  const binarySha1ToHex = (bytes: Uint8Array, offset: number): string => {
          let hash = '';
    for (let i = 0; i < SHA1_SIZE; i++) {
      const byte = bytes[offset + i];
      const hex = byte.toString(16);
      hash += hex.length < 2 ? '0' + hex : hex;
    }
    return hash;
  };
  
  // Parse tree object properly (format: mode name\0<20-byte-binary-sha1>)
  const checkTree = (result: string, buffer?: Uint8Array) => {
    // Tree objects start with "tree <size>\0" after decompression
    if (result.startsWith('tree ')) {
      // Parse from decompressed buffer if available (more reliable)
      if (buffer) {
        // Find the null byte after "tree <size>"
        let offset = 0;
        while (offset < buffer.length && buffer[offset] !== 0) {
          offset++;
        }
        if (offset >= buffer.length) return;
        
        offset++; // Skip the null byte after header
        
        // Parse entries: <mode> <filename>\0<20-byte-sha1>
        while (offset < buffer.length) {
          // Find space after mode (mode is ASCII like "100644 ")
          let modeEnd = offset;
          while (modeEnd < buffer.length && buffer[modeEnd] !== 0x20) { // 0x20 = space
            modeEnd++;
          }
          if (modeEnd >= buffer.length) break;
          
          // Find null byte after filename
          let filenameEnd = modeEnd + 1; // Skip space
          while (filenameEnd < buffer.length && buffer[filenameEnd] !== 0) {
            filenameEnd++;
          }
          if (filenameEnd >= buffer.length) break;
          
          // SHA1 starts right after null byte
          const sha1Offset = filenameEnd + 1;
          if (sha1Offset + SHA1_SIZE > buffer.length) break;
          
          // Extract SHA1 (20 bytes binary)
          const sha1Hex = binarySha1ToHex(buffer, sha1Offset);
          const objectPath = GIT_OBJECTS_PATH + sha1Hex.slice(0, 2) + '/' + sha1Hex.slice(2);
          downloadFile(objectPath, true, checkResult);
          
          // Move to next entry
          offset = sha1Offset + SHA1_SIZE;
        }
      } else {
        // Fallback: parse from decompressed text string
        // Format: tree <size>\0<mode> <filename>\0<sha1-hex>...
        const nullPos = result.indexOf('\0');
        if (nullPos === -1) return;
        
        let pos = nullPos + 1;
        const foundHashes = new Set<string>();
        
        // Parse entries from text
        while (pos < result.length) {
          // Find space (end of mode)
          const spaceIdx = result.indexOf(' ', pos);
          if (spaceIdx === -1) break;
          
          // Find null (end of filename)
          const nullIdx = result.indexOf('\0', spaceIdx + 1);
          if (nullIdx === -1) break;
          
          // SHA1 should be 40 hex chars after null
          const sha1Start = nullIdx + 1;
          if (sha1Start + 40 > result.length) break;
          
          const hash = result.substring(sha1Start, sha1Start + 40);
          // Validate it's hex
          if (/^[a-f0-9]{40}$/.test(hash) && !foundHashes.has(hash)) {
            foundHashes.add(hash);
          const objectPath = GIT_OBJECTS_PATH + hash.slice(0, 2) + '/' + hash.slice(2);
          downloadFile(objectPath, true, checkResult);
          }
          
          // Move to next entry
          pos = sha1Start + 40;
        }
      }
    }
  };
  
  // Parse index file to extract object SHA1s (Git index format)
  const checkIndex = (buffer: Uint8Array) => {
    // Git index format: DIRC signature (4 bytes) + version (4 bytes) + entries
    // Each entry has: ctime (8) + mtime (8) + dev (4) + ino (4) + mode (4) + uid (4) + gid (4) + size (4) + sha1 (20) + flags (2) + name
    if (buffer.length < 12) return;
    
    const signature = String.fromCharCode(buffer[0], buffer[1], buffer[2], buffer[3]);
    if (signature !== 'DIRC') return; // Not a valid index file
    
    // Read entry count (after version, at offset 8)
    const version = (buffer[4] << 24) | (buffer[5] << 16) | (buffer[6] << 8) | buffer[7];
    let offset = 8;
    
    // For version 2+, read entry count
    let entryCount = 0;
    if (version >= 2) {
      // Entry count is stored as a variable-length integer after version
      // But for simplicity, we'll parse until we run out of buffer
    }
    
    const foundHashes = new Set<string>();
    const fixedEntrySize = 62; // 40 (metadata) + 20 (SHA1) + 2 (flags)
    
    // Parse entries - Git index has variable-length names
    while (offset + fixedEntrySize <= buffer.length) {
      // Skip metadata (ctime, mtime, dev, ino, mode, uid, gid, size = 40 bytes)
      const sha1Offset = offset + 40;
      if (sha1Offset + SHA1_SIZE <= buffer.length) {
        const sha1Hex = binarySha1ToHex(buffer, sha1Offset);
        if (!foundHashes.has(sha1Hex)) {
          foundHashes.add(sha1Hex);
          const objectPath = GIT_OBJECTS_PATH + sha1Hex.slice(0, 2) + '/' + sha1Hex.slice(2);
          // Mark discovery to reset timeout
          lastDiscoveryTime = Date.now();
          discoveryActive = true;
          downloadFile(objectPath, true, checkResult);
        }
      }
      
      // Find next entry (skip flags + name with padding)
      const flagsOffset = sha1Offset + SHA1_SIZE;
      if (flagsOffset + 2 > buffer.length) break;
      
      // Name starts right after flags (2 bytes)
      const nameStart = flagsOffset + 2;
      
      // Find null terminator after name (name is always null-terminated in Git index)
      let nameEnd = nameStart;
      while (nameEnd < buffer.length && buffer[nameEnd] !== 0) {
        nameEnd++;
      }
      if (nameEnd >= buffer.length) break;
      
      // nameEnd now points to the null terminator
      // Entry size = fixed part (62) + name length + null (1) + padding
      const nameLengthActual = nameEnd - nameStart;
      const entrySizeWithoutPadding = 62 + nameLengthActual + 1; // +1 for null terminator
      const paddedSize = ((entrySizeWithoutPadding + 7) & ~7); // Round up to 8 bytes
      
      // Move to next entry
      offset += paddedSize;
      
      if (offset >= buffer.length) break;
    }
  };
  
  const checkObject = (result: string, buffer?: Uint8Array, path?: string) => {
    // Special handling for index file
    if (path === 'index' && buffer) {
      checkIndex(buffer);
      return;
    }
    
    // For refs, logs, and packed-refs files, be more permissive with SHA1 extraction
    const isRefsFile = path && (path.includes('refs/') || path.includes('logs/') || path === 'packed-refs' || path === 'FETCH_HEAD' || path === 'ORIG_HEAD' || path === 'HEAD');
    
    // Extract all 40-character hex strings (SHA1 hashes) from content
    const search = /\b[a-f0-9]{40}\b/g;
    let match;
    const foundHashes = new Set<string>();
    
    while ((match = search.exec(result)) !== null) {
      const hash = match[0];
      
      // For refs/logs files, accept all SHA1s (they're almost certainly Git objects)
      if (isRefsFile) {
        if (!foundHashes.has(hash)) {
          foundHashes.add(hash);
          const objectPath = GIT_OBJECTS_PATH + hash.slice(0, 2) + '/' + hash.slice(2);
          downloadFile(objectPath, true, checkResult);
        }
        continue;
      }
      
      // For other files, use context validation to avoid false positives
      const context = result.substring(Math.max(0, match.index - 10), Math.min(result.length, match.index + 50));
      const isGitContext = /^(ref:|^|\s)[a-f0-9]{40}($|\s|$)/m.test(context) ||
                          context.includes('refs/') ||
                          context.includes('commit') ||
                          context.includes('tree') ||
                          context.includes('parent') ||
                          context.includes('fetch') ||
                          context.includes('push') ||
                          context.includes('clone');
      
      if (isGitContext && !foundHashes.has(hash)) {
        foundHashes.add(hash);
        const objectPath = GIT_OBJECTS_PATH + hash.slice(0, 2) + '/' + hash.slice(2);
        downloadFile(objectPath, true, checkResult);
      }
    }
  };
  
  const checkPack = (result: string) => {
    const search = GIT_PACK_SEARCH;
    let matches;
    while ((matches = search.exec(result)) !== null) {
      if (matches.index === search.lastIndex) {
        search.lastIndex++;
      }
      for (let i = 0; i < matches.length; i++) {
        const packName = matches[i];
        const pathExt = GIT_PACK_PATH + packName + GIT_PACK_EXT;
        const pathIdx = GIT_PACK_PATH + packName + GIT_IDX_EXT;
        downloadFile(pathExt, false, () => {});
        downloadFile(pathIdx, false, () => {});
      }
    }
  };
  
  // Discover refs dynamically from ref files
  const discoverRefs = (result: string, path: string) => {
    // Parse ref files to find additional refs
    // Format: SHA1 or "ref: refs/heads/branch"
    const refMatch = result.match(/^ref:\s*(refs\/[^\s]+)/m);
    if (refMatch) {
      const refPath = refMatch[1];
      // Download the ref file
      downloadFile(refPath, false, checkResult);
      // Download corresponding log file
      downloadFile('logs/' + refPath, false, checkResult);
    }
    
    // Also find all refs mentioned in packed-refs or info/refs
    if (path === 'packed-refs' || path === 'info/refs') {
      const refPattern = /(refs\/[a-zA-Z0-9\-\.\_\/]+)/g;
      let refMatch;
      while ((refMatch = refPattern.exec(result)) !== null) {
        const refPath = refMatch[1];
        if (!refPath.endsWith('*')) {
          downloadFile(refPath, false, checkResult);
          downloadFile('logs/' + refPath, false, checkResult);
        }
      }
    }
  };
  
  const checkResult = (result: string, buffer?: Uint8Array, path?: string) => {
    checkTree(result, buffer);
    checkObject(result, buffer, path);
    checkPack(result);
    if (path) {
      discoverRefs(result, path);
    }
  };
  
  const scheduleZipCreation = () => {
    // Clear any existing timeout
    if (discoveryTimeoutId) {
      clearTimeout(discoveryTimeoutId);
      discoveryTimeoutId = null;
    }
    
    // Schedule zip creation after discovery timeout
    discoveryTimeoutId = setTimeout(() => {
    if (runningTasks === 0 && waiting === 0 && !zipCreated) {
        discoveryActive = false;
        createZip();
      }
    }, discoveryTimeout);
  };
  
  const createZip = () => {
    if (!zipCreated) {
      zipCreated = true;
      const filename = baseUrl.replace(/^https?:\/\//i, '').replace(/[.:@]/g, '_');
      const STATUS_DESCRIPTION = 'HTTP Status code for downloaded files: 200 Good, 404 Normal, 403 and 5XX Bad\n';
      let strStatus = STATUS_DESCRIPTION;
      
      Object.keys(downloadStats).forEach((key) => {
        strStatus += '\n' + key + ': ' + downloadStats[parseInt(key)];
      });
      
      downloadedFiles.forEach(([path, buffer]) => {
        zip.file(filename + GIT_PATH + path, buffer);
      });
      
      zip.file('DownloadStats.txt', strStatus);
      
      zip.generateAsync({ type: 'blob' }).then((zipBlob) => {
        saveAs(zipBlob, `${filename}.zip`);
        if (resolvePromise) resolvePromise();
      });
    }
  };
  
  const downloadFile = async (
    path: string,
    decompress: boolean,
    callback: (result: string, buffer?: Uint8Array, path?: string) => void
  ): Promise<void> => {
    if (walkedPaths.has(path)) {
      scheduleZipCreation();
      return;
    }
    
    if (failedCount > failedInARow) {
      discoveryActive = false;
      createZip();
      return;
    }
    
    if (runningTasks >= maxConnections) {
      waiting++;
      setTimeout(() => {
        waiting--;
        downloadFile(path, decompress, callback);
      }, ((waiting * wait) <= maxWait) ? (waiting * wait) : maxWait);
      return;
    }
    
    walkedPaths.add(path);
    runningTasks++;
    downloadStatus.total++;
    onProgress?.({ ...downloadStatus });
    
    try {
      const response = await fetchWithTimeout(baseUrl + GIT_PATH + path, 5000);
      if (!response) {
        runningTasks--;
        downloadStatus.failed++;
        failedCount++;
        onProgress?.({ ...downloadStatus });
        scheduleZipCreation();
        return;
      }
      
      const status = response.status;
      downloadStats[status] = (typeof downloadStats[status] === 'undefined') ? 1 : downloadStats[status] + 1;
      
      if (response.ok && status === 200) {
        // Validate response before saving (like git-dumper)
        const contentType = response.headers.get('content-type') || '';
        const contentLength = response.headers.get('content-length');
        
        // Reject HTML responses (git-dumper verify_response logic)
        if (contentType.includes('text/html')) {
          runningTasks--;
          downloadStatus.failed++;
          failedCount++;
          onProgress?.({ ...downloadStatus });
          scheduleZipCreation();
          return;
        }
        // Reject zero-length responses
        if (contentLength === '0') {
          runningTasks--;
          downloadStatus.failed++;
          failedCount++;
          onProgress?.({ ...downloadStatus });
          scheduleZipCreation();
          return;
        }
        
        const buffer = await readResponseArrayBufferWithTimeout(response, 5000);
        
        // Additional validation: check first bytes for HTML markers
        if (buffer.byteLength > 0) {
          const firstBytes = new Uint8Array(buffer.slice(0, Math.min(100, buffer.byteLength)));
          const textStart = arrayBufferToString(firstBytes).toLowerCase();
          if (textStart.includes('<!doctype') || textStart.includes('<html')) {
            // HTML detected in content - reject
            runningTasks--;
            downloadStatus.failed++;
            failedCount++;
            onProgress?.({ ...downloadStatus });
            scheduleZipCreation();
            return;
          }
        }
        
        // Process buffer if it exists (matches extension behavior exactly)
        if (typeof buffer !== 'undefined' && buffer.byteLength > 0) {
          fileExist = true;
          downloadStatus.successful++;
          failedCount = 0;
          downloadedFiles.push([path, buffer]);
          const words = new Uint8Array(buffer);
          
          // Mark that we discovered new content (may trigger more downloads)
          lastDiscoveryTime = Date.now();
          discoveryActive = true;
          
          if (decompress) {
            // decompress objects
            try {
              const data = pako.ungzip(words);
              const decompressedText = arrayBufferToString(data);
              // Pass decompressed buffer for tree parsing (binary SHA1s)
              callback(decompressedText, new Uint8Array(data), path);
            } catch (e) {
              // If decompression fails, still try to process as binary to find hashes
              // This helps with corrupted or non-gzipped objects
              const binaryText = arrayBufferToString(words);
              callback(binaryText, words, path);
            }
          } else {
            // plaintext file - also process binary files like index to find object hashes
            const text = arrayBufferToString(words);
            callback(text, words, path);
          }
          runningTasks--;
        }
        onProgress?.({ ...downloadStatus });
        scheduleZipCreation();
      } else {
        runningTasks--;
        downloadStatus.failed++;
        failedCount++;
        onProgress?.({ ...downloadStatus });
        scheduleZipCreation();
      }
    } catch {
      runningTasks--;
      downloadStatus.failed++;
      failedCount++;
      onProgress?.({ ...downloadStatus });
      scheduleZipCreation();
    }
  };
  
  // Validate HEAD first (like git-dumper)
  const validateHead = async (): Promise<boolean> => {
    try {
      const response = await fetchWithTimeout(baseUrl + GIT_HEAD_PATH, 5000);
      if (!response) return false;
      
      if (response.ok && response.status === 200) {
        const contentType = response.headers.get('content-type') || '';
        const text = await readResponseTextWithTimeout(response, 5000);
        
        // Reject HTML responses
        if (contentType.includes('text/html') || 
            text.toLowerCase().includes('<!doctype') ||
            text.toLowerCase().includes('<html')) {
          return false;
        }
        
        // Validate HEAD format: "ref: refs/heads/..." or 40-char SHA1
        const headPattern = /^(ref:\s*refs\/[^\s]+|[a-f0-9]{40})$/m;
        if (headPattern.test(text.trim())) {
          return true;
        }
      }
    } catch {
      // Ignore errors
    }
    return false;
  };
  
  // Check for directory listing (like git-dumper)
  const checkDirectoryListing = async (): Promise<boolean> => {
    try {
      const response = await fetchWithTimeout(baseUrl + GIT_PATH, 5000);
      if (!response) return false;
      
      if (response.ok && response.status === 200) {
        const contentType = response.headers.get('content-type') || '';
        const text = await readResponseTextWithTimeout(response, 5000);
        
        // Check if it's an HTML directory listing
        if (contentType.includes('text/html') && 
            (text.includes('HEAD') || text.includes('index') || text.includes('objects'))) {
          // Try to extract file links from directory listing
          const linkPattern = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
          let match;
          const foundFiles = new Set<string>();
          
          while ((match = linkPattern.exec(text)) !== null) {
            const href = match[1];
            // Filter out parent directory and non-git files
            if (href && !href.startsWith('../') && !href.startsWith('http')) {
              const cleanPath = href.replace(/^\.\//, '').split('?')[0].split('#')[0];
              if (cleanPath && !foundFiles.has(cleanPath)) {
                foundFiles.add(cleanPath);
                downloadFile(cleanPath, false, checkResult);
              }
            }
          }
          
          // Also download .gitignore if directory listing is available
          downloadFile('.gitignore', false, checkResult);
          return true;
        }
      }
    } catch {
      // Ignore errors
    }
    return false;
  };
  
  // Initialize download
  (async () => {
    // Validate HEAD first
    const isValid = await validateHead();
    if (!isValid) {
      // Still try to download, but HEAD validation failed
      console.warn('HEAD validation failed, continuing anyway');
    }
    
    // Check for directory listing
    const hasListing = await checkDirectoryListing();
    
    // Start download from well-known paths (if no directory listing)
    if (!hasListing) {
  for (let i = 0; i < GIT_WELL_KNOWN_PATHS.length; i++) {
    downloadFile(GIT_WELL_KNOWN_PATHS[i], false, checkResult);
  }
    }
  })();
  
  return downloadPromise;
}

// Download single file with validation
export async function downloadFile(url: string, filename?: string): Promise<void> {
  try {
    const response = await fetchWithTimeout(url, 5000);
    if (!response) return;
    
    if (response.ok) {
      // Get content type first
      const contentType = response.headers.get('content-type') || '';
      
      // Clone response to read text without consuming the original
      const responseClone = response.clone();
      const text = await readResponseTextWithTimeout(responseClone, 5000);
      const contentSample = text.substring(0, 1000).toLowerCase();
      
      // Check if response is HTML when it shouldn't be (false positive)
      const isHtmlResponse = contentType.includes('text/html') || 
                             contentSample.includes('<!doctype') ||
                             contentSample.includes('<html') ||
                             contentSample.includes('<!DOCTYPE');
      
      // Determine expected file type from URL
      const urlPath = new URL(url).pathname;
      const fileExtension = urlPath.split('.').pop()?.toLowerCase() || '';
      const fileName = urlPath.split('/').pop()?.toLowerCase() || '';
      
      // Validate based on file type - reject HTML false positives
      if (isHtmlResponse) {
        // Check if it's an SPA page (false positive)
        const isSpaPage = contentSample.includes('react') || 
                         contentSample.includes('angular') || 
                         contentSample.includes('vue') || 
                         contentSample.includes('app-root');
        
        // Reject HTML for non-HTML file types
        if (fileExtension && !['html', 'htm'].includes(fileExtension)) {
          throw new Error('File appears to be HTML (false positive from SPA routing)');
        }
        
        // For paths that shouldn't be HTML
        if (urlPath.includes('.env') || 
            urlPath.includes('.php') || 
            urlPath.includes('.json') || 
            urlPath.includes('.yml') || 
            urlPath.includes('.yaml') ||
            urlPath.includes('.sql') ||
            urlPath.includes('.log') ||
            urlPath.includes('.bak') ||
            urlPath.includes('.htaccess') ||
            fileName === 'robots.txt' ||
            fileName === 'sitemap.xml') {
          throw new Error('File appears to be HTML (false positive from SPA routing)');
        }
        
        // For debug/admin endpoints, only allow if it's actually debug content
        if ((urlPath.includes('/debug') || urlPath.includes('/admin')) && isSpaPage) {
          if (!contentSample.includes('phpinfo') && 
              !contentSample.includes('php version') &&
              !contentSample.includes('debug') &&
              !contentSample.includes('configuration')) {
            throw new Error('File appears to be SPA page (false positive)');
          }
        }
        
        // For API endpoints like /encryptionkeys, /ftp - reject SPA pages
        if ((urlPath.includes('/encryptionkeys') || urlPath.includes('/ftp')) && isSpaPage) {
          throw new Error('File appears to be SPA page (false positive)');
        }
      }
      
      // Create blob from original response and download
      const blob = await response.blob();
      const name = filename || urlPath.split('/').pop() || 'download';
      saveAs(blob, name);
    } else {
      throw new Error('Failed to download file');
    }
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
}

// Export results to CSV
export function exportResultsToCSV(results: ScanResult[]): void {
  const headers = ['Domain', 'Type', 'Path', 'Status', 'Found At', 'Is Open Source'];
  const rows = results.map(r => [
    r.domain,
    r.type,
    r.path,
    r.status,
    r.foundAt,
    r.isOpenSource ? 'Yes' : 'No',
  ]);
  
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `scan_results_${new Date().toISOString().split('T')[0]}.csv`);
}

// Export results to JSON
export function exportResultsToJSON(results: ScanResult[]): void {
  const json = JSON.stringify(results, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  saveAs(blob, `scan_results_${new Date().toISOString().split('T')[0]}.json`);
}
