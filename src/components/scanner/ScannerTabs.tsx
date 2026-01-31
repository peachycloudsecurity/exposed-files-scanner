import { useState } from 'react';
import { Upload, Code } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FileUploadTab } from './FileUploadTab';
import { PasteDomainsTab } from './PasteDomainsTab';

type TabId = 'upload' | 'paste';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  { id: 'upload', label: 'Upload CSV', icon: <Upload className="h-4 w-4" /> },
  { id: 'paste', label: 'Paste Domains', icon: <Code className="h-4 w-4" /> },
];

interface ScannerTabsProps {
  onDomainsLoaded: (domains: string[]) => void;
}

export function ScannerTabs({ onDomainsLoaded }: ScannerTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('upload');

  return (
    <div className="scanner-card overflow-hidden">
      {/* Tab Headers */}
      <div className="flex gap-2 p-4 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === tab.id ? 'tab-active' : 'tab-inactive'
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <div className="p-6">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'upload' && <FileUploadTab onDomainsLoaded={onDomainsLoaded} />}
          {activeTab === 'paste' && <PasteDomainsTab onDomainsLoaded={onDomainsLoaded} />}
        </motion.div>
      </div>
    </div>
  );
}
