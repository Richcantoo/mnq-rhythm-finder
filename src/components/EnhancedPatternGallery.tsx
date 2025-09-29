import React, { useState, useMemo } from 'react';
import { Search, Filter, SortAsc, SortDesc, Grid3X3, List, Calendar, MoreHorizontal, Eye, Download, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ChartImage {
  file: File;
  preview: string;
  analysis?: {
    pattern_type: string;
    confidence_score: number;
    session_time: string;
    key_levels: Array<{ type: string; price: number; strength: number }>;
    pattern_features: {
      trend_direction: string;
      volume_profile: string;
      volatility: string;
      support_resistance: Array<{ level: number; strength: number }>;
    };
  };
}

interface EnhancedPatternGalleryProps {
  images: ChartImage[];
}

type ViewMode = 'grid' | 'list';
type SortField = 'confidence' | 'date' | 'pattern' | 'session';
type SortOrder = 'asc' | 'desc';

export function EnhancedPatternGallery({ images }: EnhancedPatternGalleryProps) {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([]);
  const [confidenceRange, setConfidenceRange] = useState([0, 100]);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('confidence');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<Set<number>>(new Set());

  // Get unique values for filters
  const uniquePatterns = useMemo(() => {
    const patterns = images
      .map(img => img.analysis?.pattern_type)
      .filter(Boolean) as string[];
    return [...new Set(patterns)];
  }, [images]);

  const uniqueSessions = useMemo(() => {
    const sessions = images
      .map(img => img.analysis?.session_time)
      .filter(Boolean) as string[];
    return [...new Set(sessions)];
  }, [images]);

  // Filtered and sorted images
  const filteredAndSortedImages = useMemo(() => {
    let filtered = images.filter(img => {
      if (!img.analysis) return false;

      // Search filter
      if (searchTerm && !img.analysis.pattern_type.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Pattern filter
      if (selectedPatterns.length > 0 && !selectedPatterns.includes(img.analysis.pattern_type)) {
        return false;
      }

      // Confidence filter
      if (img.analysis.confidence_score < confidenceRange[0] || img.analysis.confidence_score > confidenceRange[1]) {
        return false;
      }

      // Session filter
      if (selectedSessions.length > 0 && !selectedSessions.includes(img.analysis.session_time)) {
        return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'confidence':
          aValue = a.analysis?.confidence_score || 0;
          bValue = b.analysis?.confidence_score || 0;
          break;
        case 'pattern':
          aValue = a.analysis?.pattern_type || '';
          bValue = b.analysis?.pattern_type || '';
          break;
        case 'session':
          aValue = a.analysis?.session_time || '';
          bValue = b.analysis?.session_time || '';
          break;
        case 'date':
          aValue = a.file.lastModified;
          bValue = b.file.lastModified;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [images, searchTerm, selectedPatterns, confidenceRange, selectedSessions, sortField, sortOrder]);

  // Helper functions
  const getPatternIcon = (pattern: string) => {
    // This should match the icons used in the original PatternGallery
    return '📈'; // Placeholder
  };

  const getPatternVariant = (pattern: string): "default" | "secondary" | "destructive" | "outline" => {
    if (pattern?.toLowerCase().includes('bullish') || pattern?.toLowerCase().includes('breakout')) return 'default';
    if (pattern?.toLowerCase().includes('bearish') || pattern?.toLowerCase().includes('breakdown')) return 'destructive';
    return 'secondary';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-bullish';
    if (confidence >= 60) return 'text-primary';
    return 'text-muted-foreground';
  };

  const handleSelectItem = (index: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectForComparison = (index: number) => {
    const newSelected = new Set(selectedForComparison);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else if (newSelected.size < 4) { // Limit to 4 for comparison
      newSelected.add(index);
    }
    setSelectedForComparison(newSelected);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedPatterns([]);
    setConfidenceRange([0, 100]);
    setSelectedSessions([]);
    setDateRange({ from: null, to: null });
  };

  const exportSelected = () => {
    const selectedData = Array.from(selectedItems).map(index => ({
      pattern: filteredAndSortedImages[index].analysis?.pattern_type,
      confidence: filteredAndSortedImages[index].analysis?.confidence_score,
      session: filteredAndSortedImages[index].analysis?.session_time,
      // Add more fields as needed
    }));

    const dataStr = JSON.stringify(selectedData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `pattern-analysis-${format(new Date(), 'yyyy-MM-dd')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Pattern Gallery</h3>
          <Badge variant="outline">{filteredAndSortedImages.length} patterns</Badge>
          {selectedItems.size > 0 && (
            <Badge variant="secondary">{selectedItems.size} selected</Badge>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-none"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          {/* Comparison Mode */}
          <Button
            variant={comparisonMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setComparisonMode(!comparisonMode)}
          >
            Compare {comparisonMode && selectedForComparison.size > 0 && `(${selectedForComparison.size})`}
          </Button>

          {/* Actions Menu */}
          {selectedItems.size > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={exportSelected}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Selected
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedItems(new Set())}>
                  Clear Selection
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Filter Toggle */}
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="bg-card/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Filters</CardTitle>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search patterns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Pattern Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Pattern Type</label>
                <Select value={selectedPatterns[0] || ''} onValueChange={(value) => setSelectedPatterns(value ? [value] : [])}>
                  <SelectTrigger>
                    <SelectValue placeholder="All patterns" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All patterns</SelectItem>
                    {uniquePatterns.map(pattern => (
                      <SelectItem key={pattern} value={pattern}>{pattern}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Session Time */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Session Time</label>
                <Select value={selectedSessions[0] || ''} onValueChange={(value) => setSelectedSessions(value ? [value] : [])}>
                  <SelectTrigger>
                    <SelectValue placeholder="All sessions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All sessions</SelectItem>
                    {uniqueSessions.map(session => (
                      <SelectItem key={session} value={session}>{session}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort By</label>
                <div className="flex gap-2">
                  <Select value={sortField} onValueChange={(value: SortField) => setSortField(value)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confidence">Confidence</SelectItem>
                      <SelectItem value="pattern">Pattern</SelectItem>
                      <SelectItem value="session">Session</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Confidence Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Confidence Range: {confidenceRange[0]}% - {confidenceRange[1]}%
              </label>
              <Slider
                value={confidenceRange}
                onValueChange={setConfidenceRange}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {filteredAndSortedImages.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No patterns match your current filters.</p>
          <Button variant="outline" onClick={clearFilters} className="mt-4">
            Clear Filters
          </Button>
        </Card>
      ) : (
        <div className={cn(
          "gap-4",
          viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "space-y-4"
        )}>
          {filteredAndSortedImages.map((image, index) => (
            <Card
              key={index}
              className={cn(
                "group cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-primary/10",
                selectedItems.has(index) && "ring-2 ring-primary",
                comparisonMode && selectedForComparison.has(index) && "ring-2 ring-bullish",
                viewMode === 'list' && "flex flex-row"
              )}
              onClick={() => {
                if (comparisonMode) {
                  handleSelectForComparison(index);
                } else {
                  handleSelectItem(index);
                }
              }}
            >
              <div className={cn(
                "relative",
                viewMode === 'list' ? "w-32 h-32 flex-shrink-0" : "w-full aspect-video"
              )}>
                <img
                  src={image.preview}
                  alt={`Chart ${index + 1}`}
                  className="w-full h-full object-cover rounded-t-lg"
                />
                
                {/* Selection indicators */}
                <div className="absolute top-2 left-2 flex gap-2">
                  {!comparisonMode && (
                    <Checkbox
                      checked={selectedItems.has(index)}
                      onChange={() => handleSelectItem(index)}
                      className="bg-background/80 backdrop-blur-sm"
                    />
                  )}
                  {comparisonMode && (
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold",
                      selectedForComparison.has(index) 
                        ? "bg-bullish border-bullish text-bullish-foreground" 
                        : "bg-background/80 border-muted-foreground"
                    )}>
                      {selectedForComparison.has(index) && Array.from(selectedForComparison).indexOf(index) + 1}
                    </div>
                  )}
                </div>

                {/* Quick actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="bg-background/80 backdrop-blur-sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Tag className="w-4 h-4 mr-2" />
                        Add Tags
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <CardContent className={cn(
                "p-3",
                viewMode === 'list' && "flex-1 flex flex-col justify-between"
              )}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant={getPatternVariant(image.analysis?.pattern_type || '')}>
                      {getPatternIcon(image.analysis?.pattern_type || '')} {image.analysis?.pattern_type}
                    </Badge>
                    <span className={cn(
                      "text-sm font-semibold",
                      getConfidenceColor(image.analysis?.confidence_score || 0)
                    )}>
                      {image.analysis?.confidence_score}%
                    </span>
                  </div>

                  {viewMode === 'list' && (
                    <div className="space-y-1 text-sm">
                      <p><span className="text-muted-foreground">Session:</span> {image.analysis?.session_time}</p>
                      <p><span className="text-muted-foreground">Trend:</span> {image.analysis?.pattern_features?.trend_direction}</p>
                      <p><span className="text-muted-foreground">Volume:</span> {image.analysis?.pattern_features?.volume_profile}</p>
                    </div>
                  )}

                  {viewMode === 'grid' && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{image.analysis?.session_time}</span>
                      <span>{image.analysis?.pattern_features?.trend_direction}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Comparison Modal */}
      {comparisonMode && selectedForComparison.size > 0 && (
        <div className="fixed bottom-4 right-4 z-50">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="shadow-lg">
                Compare Selected ({selectedForComparison.size})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl h-[80vh]">
              <DialogHeader>
                <DialogTitle>Pattern Comparison</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 h-full overflow-auto">
                {Array.from(selectedForComparison).map((index) => {
                  const image = filteredAndSortedImages[index];
                  return (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <img
                          src={image.preview}
                          alt={`Chart ${index + 1}`}
                          className="w-full aspect-video object-cover rounded-lg mb-3"
                        />
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <Badge variant={getPatternVariant(image.analysis?.pattern_type || '')}>
                              {image.analysis?.pattern_type}
                            </Badge>
                            <span className={getConfidenceColor(image.analysis?.confidence_score || 0)}>
                              {image.analysis?.confidence_score}%
                            </span>
                          </div>
                          <div className="space-y-1 text-xs">
                            <p><span className="font-medium">Session:</span> {image.analysis?.session_time}</p>
                            <p><span className="font-medium">Trend:</span> {image.analysis?.pattern_features?.trend_direction}</p>
                            <p><span className="font-medium">Volume:</span> {image.analysis?.pattern_features?.volume_profile}</p>
                            <p><span className="font-medium">Volatility:</span> {image.analysis?.pattern_features?.volatility}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}