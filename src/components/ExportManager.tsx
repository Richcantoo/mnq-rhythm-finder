import React, { useState, useEffect } from 'react';
import { Download, FileText, Database, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ExportManagerProps {
  selectedChartIds?: string[];
  onExportComplete?: () => void;
  className?: string;
}

interface ExportJob {
  id: string;
  export_type: string;
  status: string;
  record_count: number;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
}

const EXPORT_FORMATS = [
  { value: 'csv', label: 'CSV (Spreadsheet)', icon: FileText, description: 'Comma-separated values for Excel/Sheets' },
  { value: 'json', label: 'JSON (Structured)', icon: Database, description: 'Machine-readable format for developers' },
  { value: 'pdf', label: 'PDF (Report)', icon: FileText, description: 'Formatted report for viewing/printing' }
];

export function ExportManager({ selectedChartIds = [], onExportComplete, className }: ExportManagerProps) {
  const [exportFormat, setExportFormat] = useState('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [filters, setFilters] = useState({
    includeNotes: true,
    includeTags: true,
    includePredictions: true,
    dateFrom: null as Date | null,
    dateTo: null as Date | null,
    patternTypes: [] as string[],
    confidenceMin: 0,
    confidenceMax: 100
  });
  const [availablePatternTypes, setAvailablePatternTypes] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadExportHistory();
    loadPatternTypes();
  }, []);

  const loadExportHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('export_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setExportJobs(data || []);
    } catch (error) {
      console.error('Error loading export history:', error);
    }
  };

  const loadPatternTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('chart_analyses')
        .select('pattern_type')
        .order('pattern_type');

      if (error) throw error;
      
      const uniqueTypes = [...new Set(data.map(item => item.pattern_type))].filter(Boolean);
      setAvailablePatternTypes(uniqueTypes);
    } catch (error) {
      console.error('Error loading pattern types:', error);
    }
  };

  const handleExport = async () => {
    if (!exportFormat) {
      toast({
        title: "Export Format Required",
        description: "Please select an export format.",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);

    try {
      const exportData = {
        format: exportFormat,
        filters: {
          ...filters,
          dateFrom: filters.dateFrom?.toISOString(),
          dateTo: filters.dateTo?.toISOString()
        },
        chartIds: selectedChartIds.length > 0 ? selectedChartIds : undefined
      };

      const { data, error } = await supabase.functions.invoke('data-management', {
        body: {
          action: 'export_patterns',
          data: exportData
        }
      });

      if (error) throw error;

      // Create download link
      const blob = new Blob([data.data], { type: data.contentType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Downloaded ${data.recordCount} patterns as ${exportFormat.toUpperCase()}.`
      });

      onExportComplete?.();
      loadExportHistory();

    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-bullish" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-bearish" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-muted" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-bullish';
      case 'failed': return 'text-bearish';
      case 'processing': return 'text-primary';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Export Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Export Pattern Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {EXPORT_FORMATS.map((format) => {
                const Icon = format.icon;
                return (
                  <Card
                    key={format.value}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-muted/50",
                      exportFormat === format.value && "ring-2 ring-primary bg-primary/5"
                    )}
                    onClick={() => setExportFormat(format.value)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          exportFormat === format.value ? "bg-primary/20 text-primary" : "bg-muted"
                        )}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{format.label}</p>
                          <p className="text-xs text-muted-foreground">{format.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Data Selection */}
          <div className="space-y-3">
            <Label>Include Data</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeNotes"
                  checked={filters.includeNotes}
                  onCheckedChange={(checked) => 
                    setFilters(prev => ({ ...prev, includeNotes: !!checked }))
                  }
                />
                <Label htmlFor="includeNotes" className="text-sm">Pattern Notes</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeTags"
                  checked={filters.includeTags}
                  onCheckedChange={(checked) => 
                    setFilters(prev => ({ ...prev, includeTags: !!checked }))
                  }
                />
                <Label htmlFor="includeTags" className="text-sm">Tags</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includePredictions"
                  checked={filters.includePredictions}
                  onCheckedChange={(checked) => 
                    setFilters(prev => ({ ...prev, includePredictions: !!checked }))
                  }
                />
                <Label htmlFor="includePredictions" className="text-sm">Predictions</Label>
              </div>
            </div>
          </div>

          {/* Pattern Type Filter */}
          <div className="space-y-2">
            <Label>Pattern Types (optional)</Label>
            <Select onValueChange={(value) => {
              if (value && !filters.patternTypes.includes(value)) {
                setFilters(prev => ({ 
                  ...prev, 
                  patternTypes: [...prev.patternTypes, value] 
                }));
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Add pattern type filter" />
              </SelectTrigger>
              <SelectContent>
                {availablePatternTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {filters.patternTypes.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {filters.patternTypes.map(type => (
                  <Badge 
                    key={type} 
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => setFilters(prev => ({
                      ...prev,
                      patternTypes: prev.patternTypes.filter(t => t !== type)
                    }))}
                  >
                    {type} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Selection Summary */}
          <div className="p-3 bg-muted/20 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span>
                {selectedChartIds.length > 0 
                  ? `Exporting ${selectedChartIds.length} selected patterns`
                  : 'Exporting all patterns matching filters'
                }
              </span>
              <Button 
                onClick={handleExport} 
                disabled={isExporting || !exportFormat}
                size="sm"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export {exportFormat.toUpperCase()}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export History */}
      {exportJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Export History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {exportJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <p className="text-sm font-medium">
                        {job.export_type.toUpperCase()} Export
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(job.created_at).toLocaleDateString()} • {job.record_count} patterns
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge variant="outline" className={getStatusColor(job.status)}>
                      {job.status}
                    </Badge>
                    {job.completed_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Completed: {new Date(job.completed_at).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}