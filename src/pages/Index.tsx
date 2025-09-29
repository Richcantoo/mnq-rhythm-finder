import { useState } from 'react';
import { TrendingUp, Database, Brain, Upload, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from '@/components/ImageUpload';
import { PatternAnalyzer } from '@/components/PatternAnalyzer';
import { EnhancedPatternGallery } from '@/components/EnhancedPatternGallery';
import ChartPredictor from '@/components/ChartPredictor';
import { EnhancedProgressNav } from '@/components/EnhancedProgressNav';
import { MobileOptimizedHeader } from '@/components/MobileOptimizedHeader';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';

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
    <div className="min-h-screen bg-gradient-chart animate-fade-in">
      {/* Enhanced Mobile-Optimized Header */}
      <MobileOptimizedHeader
        currentStep={currentStep}
        uploadedCount={uploadedImages.length}
        analyzedCount={analyzedImages.length}
        onReset={resetWorkflow}
      />

      <main className="container mx-auto px-4 py-4 md:py-8">
        {/* Enhanced Progress Navigation */}
        <div className="mb-6 md:mb-8">
          <EnhancedProgressNav
            currentStep={currentStep}
            uploadedCount={uploadedImages.length}
            analyzedCount={analyzedImages.length}
            onStepChange={setCurrentStep}
          />
        </div>

        {/* Main Content */}
        <div className="space-y-6 md:space-y-8">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 md:mt-8">
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
              
              <EnhancedPatternGallery images={analyzedImages} />
              
              <div className="flex justify-center mt-6">
                <Button 
                  onClick={() => setCurrentStep('predict')}
                  className="gap-2"
                >
                  <Target className="w-4 h-4" />
                  Get AI Predictions
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'predict' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-foreground">AI Predictions & Analytics</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Get AI-powered predictions and view comprehensive analytics of your pattern database.
                </p>
              </div>
              
              <AnalyticsDashboard />
              
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