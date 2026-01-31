import { Shield, Sun, Moon, Youtube, Calendar, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  scanState?: 'idle' | 'scanning';
}

const APP_VERSION = '1.0.0';

export function Header({ isDarkMode, onToggleTheme, scanState = 'idle' }: HeaderProps) {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Logo + Nav Links */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-foreground">Exposed Files Scanner</h1>
                <p className="text-xs text-muted-foreground">Security Scanner v{APP_VERSION}</p>
                <p className="text-xs text-muted-foreground/70">by Peachycloud Security</p>
              </div>
            </div>

            {/* Nav Links */}
            <nav className="hidden md:flex items-center gap-4">
              <a href="https://peachycloudsecurity.com" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Home
              </a>
              <a href="https://peachycloudsecurity.com/about" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                About
              </a>
            </nav>
          </div>

          {/* Center: Mobile logo */}
          <div className="flex items-center gap-3 sm:hidden">
            <span className="text-lg font-bold text-foreground">Exposed Files</span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2">
              {scanState === 'scanning' ? (
                <span className="text-sm text-muted-foreground">Scanning...</span>
              ) : (
                <span className="text-sm text-muted-foreground">Ready to scan</span>
              )}
            </div>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleTheme}
              className="h-9 w-9"
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            {/* YouTube Follow */}
            <a
              href="https://www.youtube.com/@peachycloudsecurity"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex"
            >
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-red-500">
                <Youtube className="w-4 h-4" />
                <span className="hidden lg:inline">Follow</span>
              </Button>
            </a>

            {/* Book a Session */}
            <a
              href="https://topmate.io/peachycloudsecurity"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex"
            >
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                <Calendar className="w-4 h-4" />
                <span className="hidden lg:inline">Book a Session</span>
              </Button>
            </a>

            {/* Buy Me a Coffee */}
            <a
              href="https://github.com/sponsors/peachycloudsecurity"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-amber-500" title="Sponsor on GitHub">
                <Coffee className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
