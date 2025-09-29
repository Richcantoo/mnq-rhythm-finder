import { useState, useMemo } from 'react';
import { Search, Filter, Calendar, Clock, TrendingUp, TrendingDown, BarChart3, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

interface PatternGalleryProps {
  images: ChartImage[];
}

export const PatternGallery = ({ images }: PatternGalleryProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [patternFilter, setPatternFilter] = useState('all');
  const [sessionFilter, setSessionFilter] = useState('all');
  const [selectedImage, setSelectedImage] = useState<ChartImage | null>(null);

  const filteredImages = useMemo(() => {
    return images.filter(image => {
      const matchesSearch = image.file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           image.analysis?.pattern_type?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPattern = patternFilter === 'all' || 
                            image.analysis?.pattern_type?.toLowerCase().includes(patternFilter.toLowerCase());
      
      const matchesSession = sessionFilter === 'all' || 
                            image.analysis?.session_time === sessionFilter;

      return matchesSearch && matchesPattern && matchesSession;
    });
  }, [images, searchTerm, patternFilter, sessionFilter]);

  const getPatternIcon = (patternType: string) => {
    switch (patternType?.toLowerCase()) {
      case 'bullish':
      case 'breakout':
        return <TrendingUp className="w-3 h-3" />;
      case 'bearish':
      case 'breakdown':
        return <TrendingDown className="w-3 h-3" />;
      case 'volume':
        return <BarChart3 className="w-3 h-3" />;
      default:
        return <BarChart3 className="w-3 h-3" />;
    }
  };

  const getPatternVariant = (patternType: string) => {
    switch (patternType?.toLowerCase()) {
      case 'bullish':
      case 'breakout':
        return 'default';
      case 'bearish':
      case 'breakdown':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-bullish';
    if (score >= 0.6) return 'text-primary';
    return 'text-neutral';
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            Pattern Gallery
          </div>
          <Badge variant="outline">{filteredImages.length} charts</Badge>
        </CardTitle>
        
        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search patterns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={patternFilter} onValueChange={setPatternFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Pattern type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Patterns</SelectItem>
              <SelectItem value="bullish">Bullish</SelectItem>
              <SelectItem value="bearish">Bearish</SelectItem>
              <SelectItem value="reversal">Reversal</SelectItem>
              <SelectItem value="continuation">Continuation</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sessionFilter} onValueChange={setSessionFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Session time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sessions</SelectItem>
              <SelectItem value="pre-market">Pre-market</SelectItem>
              <SelectItem value="market-open">Market Open</SelectItem>
              <SelectItem value="lunch">Lunch Hour</SelectItem>
              <SelectItem value="power-hour">Power Hour</SelectItem>
              <SelectItem value="after-hours">After Hours</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            More Filters
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredImages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No patterns found</h3>
            <p className="text-muted-foreground">
              {images.length === 0 
                ? "Upload some chart images to start analyzing patterns"
                : "Try adjusting your search or filter criteria"
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredImages.map((image, index) => (
              <Card 
                key={index} 
                className="overflow-hidden cursor-pointer hover:scale-105 transition-smooth border-border/30 bg-chart-bg/50"
                onClick={() => setSelectedImage(image)}
              >
                <div className="aspect-video relative">
                  <img 
                    src={image.preview} 
                    alt={image.file.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {image.analysis && (
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      <Badge 
                        variant={getPatternVariant(image.analysis.pattern_type)}
                        className="text-xs"
                      >
                        {getPatternIcon(image.analysis.pattern_type)}
                        {image.analysis.pattern_type}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getConfidenceColor(image.analysis.confidence_score)}`}
                      >
                        {Math.round(image.analysis.confidence_score * 100)}%
                      </Badge>
                    </div>
                  )}
                </div>
                
                <div className="p-3">
                  <h4 className="font-medium text-sm truncate mb-2">{image.file.name}</h4>
                  
                  {image.analysis && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {image.analysis.session_time}
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <TrendingUp className="w-3 h-3" />
                        {image.analysis.pattern_features.trend_direction}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};