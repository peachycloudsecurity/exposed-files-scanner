import { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileUploadTabProps {
  onDomainsLoaded: (domains: string[]) => void;
}

const MAX_DOMAINS = 10000;

export function FileUploadTab({ onDomainsLoaded }: FileUploadTabProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [domains, setDomains] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const processFile = useCallback((file: File) => {
    setError(null);
    setWarning(null);
    setFile(file);

    Papa.parse(file, {
      complete: (results) => {
        const extractedDomains: string[] = [];
        
        results.data.forEach((row: any, index: number) => {
          if (index === 0) {
            // Check if first row is a header
            const firstCell = Array.isArray(row) ? row[0] : row;
            if (typeof firstCell === 'string') {
              const lower = firstCell.toLowerCase().trim();
              if (['domain', 'url', 'host', 'ip', 'target', 'address'].includes(lower)) {
                return; // Skip header row
              }
            }
          }
          
          // Get first column value
          const value = Array.isArray(row) ? row[0] : (typeof row === 'object' ? Object.values(row)[0] : row);
          
          if (typeof value === 'string' && value.trim()) {
            const domain = value.trim();
            // Basic validation - allow domains, IPs, and URLs
            if (domain.length > 0 && domain.length < 500) {
              extractedDomains.push(domain);
            }
          }
        });
        
        if (extractedDomains.length === 0) {
          setError('No valid domains or IPs found in the file');
          setDomains([]);
          return;
        }
        
        if (extractedDomains.length > MAX_DOMAINS) {
          setWarning(`File contains ${extractedDomains.length} entries. Only the first ${MAX_DOMAINS} will be scanned.`);
          setDomains(extractedDomains.slice(0, MAX_DOMAINS));
          onDomainsLoaded(extractedDomains.slice(0, MAX_DOMAINS));
        } else {
          setDomains(extractedDomains);
          onDomainsLoaded(extractedDomains);
        }
      },
      error: (err) => {
        setError(`Failed to parse CSV: ${err.message}`);
        setDomains([]);
      },
    });
  }, [onDomainsLoaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (!droppedFile.name.endsWith('.csv')) {
        setError('Please upload a CSV file');
        return;
      }
      processFile(droppedFile);
    }
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please upload a CSV file');
        return;
      }
      processFile(selectedFile);
    }
  }, [processFile]);

  const clearFile = useCallback(() => {
    setFile(null);
    setDomains([]);
    setError(null);
    setWarning(null);
    onDomainsLoaded([]);
  }, [onDomainsLoaded]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Drag and drop your CSV file here</p>
      
      <div
        className={cn(
          'drop-zone relative min-h-[200px] flex flex-col items-center justify-center p-8 cursor-pointer transition-all',
          isDragging && 'drop-zone-active',
          file && 'border-success bg-success/5'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !file && document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileSelect}
        />
        
        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Supports: CSV files with domains or IPs (max 10,000 entries)
              </p>
              <Button variant="outline" size="sm" type="button">
                Browse Files
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="file"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <FileText className="h-8 w-8 text-success" />
                <div className="text-left">
                  <p className="font-medium text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {domains.length.toLocaleString()} domains/IPs ready to scan
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); clearFile(); }}>
                Remove File
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
        
        {warning && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 text-warning text-sm"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{warning}</span>
          </motion.div>
        )}
        
        {domains.length > 0 && !error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 p-3 rounded-lg bg-success/10 text-success text-sm"
          >
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>{domains.length.toLocaleString()} domains/IPs loaded successfully</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
