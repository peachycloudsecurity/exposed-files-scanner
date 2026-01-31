import { useState, useCallback, useEffect } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';

interface PasteDomainsTabProps {
  onDomainsLoaded: (domains: string[]) => void;
}

const MAX_DOMAINS = 10000;

export function PasteDomainsTab({ onDomainsLoaded }: PasteDomainsTabProps) {
  const [input, setInput] = useState('');
  const [domains, setDomains] = useState<string[]>([]);
  const [warning, setWarning] = useState<string | null>(null);

  const processInput = useCallback((text: string) => {
    setWarning(null);
    
    // Split by newlines, commas, or spaces
    const parts = text
      .split(/[\n,\s]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && s.length < 500);
    
    if (parts.length > MAX_DOMAINS) {
      setWarning(`Input contains ${parts.length} entries. Only the first ${MAX_DOMAINS} will be scanned.`);
      setDomains(parts.slice(0, MAX_DOMAINS));
      onDomainsLoaded(parts.slice(0, MAX_DOMAINS));
    } else {
      setDomains(parts);
      onDomainsLoaded(parts);
    }
  }, [onDomainsLoaded]);

  useEffect(() => {
    processInput(input);
  }, [input, processInput]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Paste your domains/IPs here (one per line or comma-separated)</p>
      
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={`example.com
https://test.example.com
192.168.1.1
subdomain.example.org`}
        className="min-h-[200px] font-mono text-sm bg-scanner-code-bg resize-none"
      />
      
      <AnimatePresence>
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
        
        {domains.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 p-3 rounded-lg bg-success/10 text-success text-sm"
          >
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>{domains.length.toLocaleString()} domains/IPs detected</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
