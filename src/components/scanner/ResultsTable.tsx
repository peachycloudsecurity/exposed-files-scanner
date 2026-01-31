import { useState, useMemo } from 'react';
import { Download, ExternalLink, Search, ChevronDown, FileDown, FileJson, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { ScanResult, FindingType } from '@/lib/scanner-types';
import { FINDING_TYPE_LABELS, FINDING_TYPE_COLORS } from '@/lib/scanner-types';
import { cn } from '@/lib/utils';

interface ResultsTableProps {
  results: ScanResult[];
  onDownloadGit: (url: string, itemId: string) => void;
  onDownloadFile: (url: string, itemId: string) => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  downloadingItems?: Set<string>;
}

type SortField = 'domain' | 'type' | 'path' | 'status';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE = 50;

export function ResultsTable({
  results,
  onDownloadGit,
  onDownloadFile,
  onExportCSV,
  onExportJSON,
  downloadingItems = new Set(),
}: ResultsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('domain');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [typeFilters, setTypeFilters] = useState<FindingType[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const allTypes = useMemo(() => {
    const types = new Set<FindingType>();
    results.forEach(r => types.add(r.type));
    return Array.from(types);
  }, [results]);

  const filteredResults = useMemo(() => {
    let filtered = [...results];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.domain.toLowerCase().includes(query) ||
        r.path.toLowerCase().includes(query) ||
        r.type.toLowerCase().includes(query)
      );
    }
    
    // Apply type filters
    if (typeFilters.length > 0) {
      filtered = filtered.filter(r => typeFilters.includes(r.type));
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [results, searchQuery, typeFilters, sortField, sortDirection]);

  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredResults.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredResults, currentPage]);

  const totalPages = Math.ceil(filteredResults.length / ITEMS_PER_PAGE);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleTypeFilter = (type: FindingType) => {
    setTypeFilters(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
    setCurrentPage(1);
  };

  if (results.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="scanner-card overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-foreground">
            Scan Results ({filteredResults.length})
          </h2>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:flex-none sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search domains..."
                className="pl-9"
              />
            </div>
            
            {/* Type Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <Filter className="h-4 w-4" />
                  {typeFilters.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                      {typeFilters.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {allTypes.map(type => (
                  <DropdownMenuCheckboxItem
                    key={type}
                    checked={typeFilters.includes(type)}
                    onCheckedChange={() => toggleTypeFilter(type)}
                  >
                    {FINDING_TYPE_LABELS[type]}
                  </DropdownMenuCheckboxItem>
                ))}
                {typeFilters.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setTypeFilters([])}>
                      Clear filters
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Export */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Export</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onExportCSV}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onExportJSON}>
                  <FileJson className="h-4 w-4 mr-2" />
                  Export as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-secondary/50"
                onClick={() => handleSort('domain')}
              >
                Domain/IP
                {sortField === 'domain' && (
                  <ChevronDown className={cn(
                    "inline h-4 w-4 ml-1 transition-transform",
                    sortDirection === 'desc' && "rotate-180"
                  )} />
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-secondary/50"
                onClick={() => handleSort('type')}
              >
                Type
                {sortField === 'type' && (
                  <ChevronDown className={cn(
                    "inline h-4 w-4 ml-1 transition-transform",
                    sortDirection === 'desc' && "rotate-180"
                  )} />
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-secondary/50"
                onClick={() => handleSort('path')}
              >
                Path Found
                {sortField === 'path' && (
                  <ChevronDown className={cn(
                    "inline h-4 w-4 ml-1 transition-transform",
                    sortDirection === 'desc' && "rotate-180"
                  )} />
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-secondary/50"
                onClick={() => handleSort('status')}
              >
                Status
                {sortField === 'status' && (
                  <ChevronDown className={cn(
                    "inline h-4 w-4 ml-1 transition-transform",
                    sortDirection === 'desc' && "rotate-180"
                  )} />
                )}
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {paginatedResults.map((result) => (
                <motion.tr
                  key={result.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="finding-row"
                >
                  <TableCell>
                    <a
                      href={result.foundAt}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
                    >
                      <span className="font-mono text-sm truncate max-w-[200px]">
                        {result.domain}
                      </span>
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={cn("font-normal", FINDING_TYPE_COLORS[result.type])}
                    >
                      {FINDING_TYPE_LABELS[result.type]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <code className="scanner-code text-xs">
                      {result.path}
                    </code>
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "inline-flex items-center px-2 py-1 rounded text-xs font-medium",
                      result.status === 'success' ? 'status-success' : 'status-error'
                    )}>
                      {result.status === 'success' ? 'Found' : 'Error'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2"
                      onClick={() => result.type === 'git' 
                        ? onDownloadGit(result.domain, result.id) 
                        : onDownloadFile(result.foundAt, result.id)
                      }
                      disabled={downloadingItems.has(result.id)}
                    >
                      <Download className="h-4 w-4" />
                      {downloadingItems.has(result.id) ? 'Downloading...' : 'Download'}
                    </Button>
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-border flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredResults.length)} of {filteredResults.length}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
