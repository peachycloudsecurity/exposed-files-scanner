import { Play, Square, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { ScanProgress } from '@/lib/scanner-types';
import { cn } from '@/lib/utils';

interface ScanControlsProps {
  domainsCount: number;
  progress: ScanProgress;
  onStartScan: () => void;
  onCancelScan: () => void;
}

export function ScanControls({
  domainsCount,
  progress,
  onStartScan,
  onCancelScan,
}: ScanControlsProps) {
  const isScanning = progress.status === 'scanning';
  const isReady = domainsCount > 0 && !isScanning;

  return (
    <div className="scanner-card p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex items-center justify-center w-5 h-5 rounded-full border-2 transition-colors',
            isReady ? 'border-success bg-success' : 'border-border'
          )}>
            {isReady && <CheckCircle2 className="h-3 w-3 text-success-foreground" />}
          </div>
          <span className="text-sm text-foreground">
            {domainsCount > 0 
              ? `${domainsCount.toLocaleString()} domains/IPs ready to scan`
              : 'Ready to scan'}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {isScanning && (
            <Button
              variant="outline"
              onClick={onCancelScan}
              className="gap-2"
            >
              <Square className="h-4 w-4" />
              Cancel
            </Button>
          )}
          
          <Button
            onClick={onStartScan}
            disabled={!isReady}
            className="gap-2 gradient-primary text-primary-foreground border-0 hover:opacity-90"
          >
            {isScanning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run Scan
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Progress Bar */}
      {isScanning && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-6 space-y-3"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Scanning: <span className="text-foreground font-medium">{progress.currentDomain}</span>
            </span>
            <span className="text-muted-foreground">
              {progress.completed} / {progress.total}
            </span>
          </div>
          
          <div className="relative h-2 rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 gradient-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(progress.completed / progress.total) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Findings detected: <span className="text-success font-medium">{progress.findings}</span></span>
            {progress.estimatedTimeRemaining > 0 && (
              <span>Est. remaining: {progress.estimatedTimeRemaining}s</span>
            )}
          </div>
        </motion.div>
      )}
      
      {/* Completed State */}
      {progress.status === 'completed' && progress.total > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 flex items-center gap-2 text-sm text-success"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Scan completed! Found {progress.findings} potential issues.</span>
        </motion.div>
      )}
      
      {/* Cancelled State */}
      {progress.status === 'cancelled' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-sm text-muted-foreground"
        >
          Scan cancelled. {progress.completed} of {progress.total} domains scanned.
        </motion.div>
      )}
    </div>
  );
}
