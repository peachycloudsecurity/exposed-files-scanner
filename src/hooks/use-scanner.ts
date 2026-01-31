import { useState, useCallback, useRef } from 'react';
import type { ScanOptions, ScanResult, ScanProgress } from '@/lib/scanner-types';
import { DEFAULT_SCAN_OPTIONS } from '@/lib/scanner-types';
import { scanDomains, downloadGitRepo, downloadFile, exportResultsToCSV, exportResultsToJSON } from '@/lib/scanner-engine';

export function useScanner() {
  const [options, setOptions] = useState<ScanOptions>(DEFAULT_SCAN_OPTIONS);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [progress, setProgress] = useState<ScanProgress>({
    total: 0,
    completed: 0,
    findings: 0,
    currentDomain: '',
    status: 'idle',
    estimatedTimeRemaining: 0,
  });
  const [downloadingItems, setDownloadingItems] = useState<Set<string>>(new Set());
  const [downloadProgress, setDownloadProgress] = useState<{
    url: string;
    successful: number;
    failed: number;
    total: number;
  } | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const startScan = useCallback(async (domains: string[]) => {
    // Reset state
    setResults([]);
    setProgress({
      total: domains.length,
      completed: 0,
      findings: 0,
      currentDomain: '',
      status: 'scanning',
      estimatedTimeRemaining: 0,
    });
    
    // Create abort controller
    abortControllerRef.current = new AbortController();
    
    try {
      await scanDomains(
        domains,
        options,
        (prog) => setProgress(prog),
        (result) => setResults(prev => [...prev, result]),
        abortControllerRef.current.signal
      );
    } catch (error) {
      console.error('Scan error:', error);
    }
  }, [options]);

  const cancelScan = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setProgress(prev => ({ ...prev, status: 'cancelled' }));
  }, []);

  const downloadGit = useCallback(async (url: string, itemId: string) => {
    setDownloadingItems(prev => new Set(prev).add(itemId));
    setDownloadProgress({ url, successful: 0, failed: 0, total: 0 });
    
    try {
      await downloadGitRepo(url, (prog) => {
        setDownloadProgress({ url, ...prog });
      });
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setDownloadProgress(null);
      setDownloadingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  }, []);

  const downloadSingleFile = useCallback(async (url: string, itemId: string) => {
    setDownloadingItems(prev => new Set(prev).add(itemId));
    try {
      await downloadFile(url);
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setDownloadingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  }, []);

  const exportCSV = useCallback(() => {
    exportResultsToCSV(results);
  }, [results]);

  const exportJSON = useCallback(() => {
    exportResultsToJSON(results);
  }, [results]);

  const updateOptions = useCallback((newOptions: Partial<ScanOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }));
  }, []);

  const resetOptions = useCallback(() => {
    setOptions(DEFAULT_SCAN_OPTIONS);
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setProgress({
      total: 0,
      completed: 0,
      findings: 0,
      currentDomain: '',
      status: 'idle',
      estimatedTimeRemaining: 0,
    });
  }, []);

  return {
    options,
    results,
    progress,
    downloadProgress,
    downloadingItems,
    startScan,
    cancelScan,
    downloadGit,
    downloadSingleFile,
    exportCSV,
    exportJSON,
    updateOptions,
    resetOptions,
    clearResults,
  };
}
