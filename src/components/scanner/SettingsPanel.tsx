import { useState } from 'react';
import { Settings, ChevronDown, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { ScanOptions } from '@/lib/scanner-types';
import { PATH_CATEGORIES } from '@/lib/scanner-paths';
import { cn } from '@/lib/utils';

interface SettingsPanelProps {
  options: ScanOptions;
  onUpdateOptions: (options: Partial<ScanOptions>) => void;
  onResetOptions: () => void;
}

export function SettingsPanel({ options, onUpdateOptions, onResetOptions }: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleFunction = (key: keyof ScanOptions['functions']) => {
    onUpdateOptions({
      functions: {
        ...options.functions,
        [key]: !options.functions[key],
      },
    });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="scanner-card overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium text-foreground">Scan Settings</span>
            </div>
            <ChevronDown className={cn(
              "h-5 w-5 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )} />
          </button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 pt-0 space-y-6"
          >
            {/* Path Categories */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">Scan Categories</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(PATH_CATEGORIES).map(([key, { label }]) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <Label htmlFor={key} className="text-sm cursor-pointer">
                      {label}
                    </Label>
                    <Switch
                      id={key}
                      checked={options.functions[key as keyof ScanOptions['functions']]}
                      onCheckedChange={() => toggleFunction(key as keyof ScanOptions['functions'])}
                    />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Advanced Options */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Advanced Options</h3>
              
              {/* Timeout */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Request Timeout</Label>
                  <span className="text-sm font-medium text-foreground">{options.timeout / 1000}s</span>
                </div>
                <Slider
                  value={[options.timeout]}
                  onValueChange={([value]) => {
                    if (value !== options.timeout) {
                      onUpdateOptions({ timeout: value });
                    }
                  }}
                  min={3000}
                  max={30000}
                  step={1000}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>3s</span>
                  <span>30s</span>
                </div>
              </div>
              
              {/* Max Connections */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Max Concurrent Requests</Label>
                  <span className="text-sm text-muted-foreground">{options.maxConnections}</span>
                </div>
                <Slider
                  value={[options.maxConnections]}
                  onValueChange={([value]) => onUpdateOptions({ maxConnections: value })}
                  min={5}
                  max={50}
                  step={5}
                  className="w-full"
                />
              </div>
              
            </div>
            
            {/* Reset Button */}
            <div className="pt-2">
              <Button
                variant="outline"
                onClick={onResetOptions}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset to Defaults
              </Button>
            </div>
          </motion.div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
