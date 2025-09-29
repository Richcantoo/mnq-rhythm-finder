import { useState } from 'react';
import { TrendingUp, Database, Brain, Upload, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from '@/components/ImageUpload';
import { PatternAnalyzer } from '@/components/PatternAnalyzer';
import { PatternGallery } from '@/components/PatternGallery';
import ChartPredictor from '@/components/ChartPredictor';

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

const Index = () => {
  const [uploadedImages, setUploadedImages] = useState<Array<{ file: File; preview: string }>>([]);
  const [analyzedImages, setAnalyzedImages] = useState<ChartImage[]>([]);
  const [currentStep, setCurrentStep] = useState<'upload' | 'analyze' | 'gallery' | 'predict'>('upload');

  const handleUploadComplete = (files: Array<{ file: File; preview: string }>) => {
    setUploadedImages(files);
    setCurrentStep('analyze');
  };

  const handleAnalysisComplete = (results: ChartImage[]) => {
    setAnalyzedImages(results);
    setCurrentStep('gallery');
  };

  const resetWorkflow = () => {
    setUploadedImages([]);
    setAnalyzedImages([]);
    setCurrentStep('upload');
  };

  return (
    <div className="min-h-screen bg-gradient-chart">
      {/* Header */}
      <header className="border-b border-border/20 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">MNQ Rhythm Finder</h1>
                <p className="text-sm text-muted-foreground">AI-Powered Chart Pattern Recognition</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1">
                <Brain className="w-3 h-3" />
                AI-Powered
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Database className="w-3 h-3" />
                Lovable Cloud
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-smooth ${
              currentStep === 'upload' ? 'bg-primary/20 text-primary' : 
              uploadedImages.length > 0 ? 'bg-bullish/20 text-bullish' : 'bg-muted/20 text-muted-foreground'
            }`}>
              <Upload className="w-4 h-4" />
              <span className="text-sm font-medium">Upload</span>
            </div>
            
            <div className={`w-8 h-0.5 transition-smooth ${
              uploadedImages.length > 0 ? 'bg-primary' : 'bg-muted/30'
            }`} />
            
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-smooth ${
              currentStep === 'analyze' ? 'bg-primary/20 text-primary' : 
              analyzedImages.length > 0 ? 'bg-bullish/20 text-bullish' : 'bg-muted/20 text-muted-foreground'
            }`}>
              <Brain className="w-4 h-4" />
              <span className="text-sm font-medium">Analyze</span>
            </div>
            
            <div className={`w-8 h-0.5 transition-smooth ${
              analyzedImages.length > 0 ? 'bg-primary' : 'bg-muted/30'
            }`} />
            
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-smooth ${
              currentStep === 'gallery' ? 'bg-primary/20 text-primary' : 'bg-muted/20 text-muted-foreground'
            }`}>
              <Database className="w-4 h-4" />
              <span className="text-sm font-medium">Gallery</span>
            </div>
            
            <div className={`w-8 h-0.5 transition-smooth bg-muted/30`} />
            
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-smooth ${
              currentStep === 'predict' ? 'bg-primary/20 text-primary' : 'bg-muted/20 text-muted-foreground'
            }`}>
              <Target className="w-4 h-4" />
              <span className="text-sm font-medium">Predict</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {currentStep === 'upload' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Upload Your MNQ Charts</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Upload thousands of 5-minute MNQ chart screenshots to build an intelligent pattern database. 
                  Our AI will analyze each chart for recurring patterns, trading opportunities, and market rhythm.
                </p>
              </div>
              
              <ImageUpload onUploadComplete={handleUploadComplete} />
              
              {/* Features Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <Card className="bg-card/30 border-border/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Brain className="w-5 h-5 text-primary" />
                      Pattern Recognition
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Advanced AI identifies breakouts, reversals, and continuation patterns with confidence scoring.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-card/30 border-border/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-bullish" />
                      Time Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Correlates patterns with session times, seasons, and market conditions for deeper insights.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-card/30 border-border/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Database className="w-5 h-5 text-primary" />
                      Smart Database
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Builds a searchable repository of patterns to predict future MNQ movements.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {currentStep === 'analyze' && uploadedImages.length > 0 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-foreground">AI Pattern Analysis</h2>
                <p className="text-muted-foreground">
                  Our AI will analyze each chart for patterns, support/resistance levels, and trading opportunities.
                </p>
              </div>
              
              <PatternAnalyzer 
                images={uploadedImages} 
                onAnalysisComplete={handleAnalysisComplete}
              />
              
              <div className="flex justify-center">
                <Button variant="outline" onClick={resetWorkflow}>
                  Upload Different Images
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'gallery' && analyzedImages.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Pattern Gallery</h2>
                  <p className="text-muted-foreground">
                    Browse and filter your analyzed chart patterns
                  </p>
                </div>
                
                <Button variant="outline" onClick={resetWorkflow}>
                  Add More Charts
                </Button>
              </div>
              
              <PatternGallery images={analyzedImages} />
            </div>
          )}

          {currentStep === 'predict' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-foreground">AI Chart Prediction</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Upload your current MNQ chart to get AI-powered predictions based on historical patterns and market analysis.
                </p>
              </div>
              
              <ChartPredictor />
              
              <div className="flex justify-center">
                <Button variant="outline" onClick={resetWorkflow}>
                  Start Over
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;