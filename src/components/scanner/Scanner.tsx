import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Header } from './Header';
import { HeroSection } from './HeroSection';
import { ScannerTabs } from './ScannerTabs';
import { ScanControls } from './ScanControls';
import { ResultsTable } from './ResultsTable';
import { SettingsPanel } from './SettingsPanel';
import { useScanner } from '@/hooks/use-scanner';
import { useToast } from '@/hooks/use-toast';
import { Github, ExternalLink, Youtube, Calendar, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Scanner() {
  const [domains, setDomains] = useState<string[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { toast } = useToast();
  const {
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
  } = useScanner();

  useEffect(() => {
    // Initialize theme from localStorage or default to dark
    const savedTheme = localStorage.getItem('exposedfiles-theme');
    const prefersDark = savedTheme === 'dark' || (!savedTheme && true);
    setIsDarkMode(prefersDark);

    if (prefersDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);

    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    localStorage.setItem('exposedfiles-theme', newMode ? 'dark' : 'light');
  };

  const handleDomainsLoaded = useCallback((loadedDomains: string[]) => {
    setDomains(loadedDomains);
  }, []);

  const handleStartScan = useCallback(() => {
    if (domains.length === 0) {
      toast({
        title: 'No domains loaded',
        description: 'Please upload a CSV file or paste domains to scan.',
        variant: 'destructive',
      });
      return;
    }
    startScan(domains);
  }, [domains, startScan, toast]);

  const handleDownloadGit = useCallback(async (url: string, itemId: string) => {
    toast({
      title: 'Download started',
      description: 'Downloading Git repository files...',
    });
    
    try {
      await downloadGit(url, itemId);
      toast({
        title: 'Download complete',
        description: 'Git repository has been downloaded as a ZIP file.',
      });
    } catch (error) {
      toast({
        title: 'Download failed',
        description: 'Failed to download some files. This may be due to CORS restrictions.',
        variant: 'destructive',
      });
    }
  }, [downloadGit, toast]);

  const handleDownloadFile = useCallback(async (url: string, itemId: string) => {
    try {
      await downloadSingleFile(url, itemId);
      toast({
        title: 'Download complete',
        description: 'File has been downloaded.',
      });
    } catch (error) {
      toast({
        title: 'Download failed',
        description: 'Failed to download file. This may be due to CORS restrictions.',
        variant: 'destructive',
      });
    }
  }, [downloadSingleFile, toast]);

  const scanState = progress.isScanning ? 'scanning' : 'idle';

  return (
    <div className="min-h-screen bg-background">
      <Header
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        scanState={scanState}
      />

      <main className="container mx-auto px-4 py-8">
        <HeroSection />
        
        <div className="max-w-4xl mx-auto space-y-6">
          <ScannerTabs onDomainsLoaded={handleDomainsLoaded} />
          
          <ScanControls
            domainsCount={domains.length}
            progress={progress}
            onStartScan={handleStartScan}
            onCancelScan={cancelScan}
          />
          
          <SettingsPanel
            options={options}
            onUpdateOptions={updateOptions}
            onResetOptions={resetOptions}
          />
          
          <ResultsTable
            results={results}
            onDownloadGit={handleDownloadGit}
            onDownloadFile={handleDownloadFile}
            onExportCSV={exportCSV}
            onExportJSON={exportJSON}
            downloadingItems={downloadingItems}
          />
        </div>
      </main>

      {/* Subscribe / Waitlist CTA */}
      <section className="border-t border-border bg-card/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
            <p className="text-sm text-muted-foreground">Stay updated with new features and security rules</p>
            <div className="flex gap-3">
              <a
                href="https://www.youtube.com/@peachycloudsecurity"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="gap-2">
                  <Youtube className="w-4 h-4" />
                  Subscribe
                </Button>
              </a>
              <a
                href="https://peachycloudsecurity.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Visit Website
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Footer Links */}
            <div className="flex items-center gap-6 text-sm">
              <a
                href="https://peachycloudsecurity.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Website
              </a>
              <a
                href="https://github.com/peachycloudsecurity/exposed-files-scanner"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                <Github className="w-4 h-4" />
                GitHub
              </a>
              <a
                href="https://topmate.io/peachycloudsecurity"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                1:1 Consultations
              </a>
            </div>

            {/* Right Side Links */}
            <div className="flex items-center gap-4 text-xs">
              <a
                href="https://peachycloudsecurity.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                Peachy Cloud Security
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://topmate.io/peachycloudsecurity"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                <Calendar className="w-3 h-3" />
                1:1 Consultations
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Bottom Line */}
          <div className="mt-4 pt-4 border-t border-border/50 text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              Exposed Files Scanner • 100% Client-Side • No Data Leaves Your Browser
            </p>
            <p className="text-xs text-muted-foreground/70">
              Created by <span className="font-medium text-foreground">The Shukla Duo (Anjali & Divyanshu)</span> •
              <a href="https://peachycloudsecurity.com" target="_blank" rel="noopener noreferrer" className="ml-1 hover:text-foreground transition-colors">
                Peachycloud Security
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* CTA Section - From main page */}
      <section className="py-8 sm:py-10 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4">
            Ready to Level Up Your Cloud Security Skills?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
            Subscribe to get notified when new videos drop. Join thousands of
            security professionals learning cloud security the practical way.
          </p>
          <p className="text-base sm:text-lg font-semibold text-primary mb-3 sm:mb-4">@peachycloudsecurity</p>
          <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
            <a href="https://peachycloudsecurity.com" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="gap-2">
                <ExternalLink className="h-5 w-5" />
                Visit Website
              </Button>
            </a>
            <a href="https://www.youtube.com/@peachycloudsecurity" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2 bg-red-600 hover:bg-red-700 text-white border-0">
                <Youtube className="h-5 w-5" />
                Subscribe on YouTube
              </Button>
            </a>
            <a href="https://topmate.io/peachycloudsecurity" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="gap-2">
                <Calendar className="h-5 w-5" />
                1:1 Consultations
              </Button>
            </a>
          </div>
          <div className="mt-4">
            <a
              href="https://github.com/sponsors/peachycloudsecurity"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-red-500 transition-colors"
              aria-label="Sponsor on GitHub"
            >
              <Heart className="h-5 w-5" />
              <span className="text-sm">Sponsor On GitHub</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
