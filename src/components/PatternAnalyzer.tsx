import { useState, useEffect } from 'react';
import { Brain, Clock, TrendingUp, TrendingDown, BarChart3, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

interface PatternAnalyzerProps {
  images: Array<{ file: File; preview: string }>;
  onAnalysisComplete: (results: ChartImage[]) => void;
}

export const PatternAnalyzer = ({ images, onAnalysisComplete }: PatternAnalyzerProps) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentImage, setCurrentImage] = useState<string>('');
  const { toast } = useToast();

  const analyzeImages = async () => {
    setAnalyzing(true);
    setProgress(0);

    try {
      const results: ChartImage[] = [];
      
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        setCurrentImage(image.file.name);
        setProgress(((i + 1) / images.length) * 100);

        // Convert image to base64 for AI analysis
        const base64 = await convertToBase64(image.file);
        
        // Call our edge function for AI analysis
        const { data: analysisResult, error } = await supabase.functions.invoke('analyze-chart', {
          body: { 
            image: base64,
            filename: image.file.name 
          }
        });

        if (error) {
          console.error('Analysis error:', error);
          toast({
            title: "Analysis error",
            description: `Failed to analyze ${image.file.name}`,
            variant: "destructive",
          });
          continue;
        }

        results.push({
          ...image,
          analysis: analysisResult
        });

        // Store analysis in database for future predictions
        if (analysisResult?.chart_date) {
          const { error: insertError } = await supabase
            .from('chart_analyses')
            .insert({
              filename: image.file.name,
              chart_date: analysisResult.chart_date,
              day_of_week: analysisResult.day_of_week || 'unknown',
              pattern_type: analysisResult.pattern_type || 'unknown',
              confidence_score: analysisResult.confidence_score || 0,
              price_direction: analysisResult.pattern_features?.trend_direction || 'neutral',
              key_levels: analysisResult.key_levels || [],
              pattern_features: analysisResult.pattern_features || {},
              temporal_patterns: analysisResult.temporal_patterns || {},
              session_details: analysisResult.session_details || {},
              seasonal_context: analysisResult.seasonal_context || {}
            });
          
          if (insertError) {
            console.error('Error storing analysis:', insertError);
          }
        }

        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      onAnalysisComplete(results);
      
      toast({
        title: "Analysis complete!",
        description: `Successfully analyzed ${results.length} chart images.`,
      });

    } catch (error) {
      console.error('Error during analysis:', error);
      toast({
        title: "Analysis failed",
        description: "Something went wrong during the analysis process.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
      setProgress(0);
      setCurrentImage('');
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:image/png;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const getPatternIcon = (patternType: string) => {
    switch (patternType?.toLowerCase()) {
      case 'bullish':
      case 'breakout':
        return <TrendingUp className="w-4 h-4" />;
      case 'bearish':
      case 'breakdown':
        return <TrendingDown className="w-4 h-4" />;
      case 'volume':
        return <BarChart3 className="w-4 h-4" />;
      default:
        return <Brain className="w-4 h-4" />;
    }
  };

  const getPatternColor = (patternType: string) => {
    switch (patternType?.toLowerCase()) {
      case 'bullish':
      case 'breakout':
        return 'bullish';
      case 'bearish':
      case 'breakdown':
        return 'bearish';
      default:
        return 'neutral';
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          AI Pattern Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 rounded-lg bg-chart-bg border border-border/30">
            <div className="text-2xl font-bold text-primary">{images.length}</div>
            <div className="text-sm text-muted-foreground">Images Loaded</div>
          </div>
          
          <div className="text-center p-4 rounded-lg bg-chart-bg border border-border/30">
            <div className="text-2xl font-bold text-bullish">AI-Powered</div>
            <div className="text-sm text-muted-foreground">Pattern Recognition</div>
          </div>
          
          <div className="text-center p-4 rounded-lg bg-chart-bg border border-border/30">
            <div className="text-2xl font-bold text-primary">5min</div>
            <div className="text-sm text-muted-foreground">MNQ Timeframe</div>
          </div>
        </div>

        {analyzing && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Analyzing: {currentImage}</span>
              <span className="text-primary font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-muted/30 rounded-full h-2">
              <div 
                className="bg-gradient-primary h-2 rounded-full transition-smooth" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-center gap-2 py-4">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">Processing chart patterns...</span>
            </div>
          </div>
        )}

        {!analyzing && images.length > 0 && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Ready to analyze {images.length} chart images for:
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Badge variant="outline" className="justify-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                Breakouts
              </Badge>
              <Badge variant="outline" className="justify-center">
                <TrendingDown className="w-3 h-3 mr-1" />
                Breakdowns
              </Badge>
              <Badge variant="outline" className="justify-center">
                <BarChart3 className="w-3 h-3 mr-1" />
                Volume Spikes
              </Badge>
              <Badge variant="outline" className="justify-center">
                <Clock className="w-3 h-3 mr-1" />
                Time Patterns
              </Badge>
            </div>

            <Button 
              onClick={analyzeImages}
              variant="premium"
              size="lg"
              className="w-full"
              disabled={analyzing}
            >
              <Brain className="w-4 h-4 mr-2" />
              Start AI Analysis
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};