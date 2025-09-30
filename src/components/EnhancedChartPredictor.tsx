import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Upload, TrendingUp, TrendingDown, Target, AlertTriangle, Brain, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TechnicalIndicatorsDisplay } from './TechnicalIndicatorsDisplay';
import { PredictionOutcomeTracker } from './PredictionOutcomeTracker';

interface EnhancedPrediction {
  current_analysis: {
    chart_date: string;
    day_of_week: string;
    sentiment_label: string;
    price_direction: string;
    momentum: string;
    volatility: string;
    volume_profile: string;
    session_type: string;
    key_levels: Array<{type: string; price: number; strength: number}>;
    technical_indicators?: {
      rsi: number;
      atr: number;
      macd: { value: number; signal: number; histogram: number };
      volume_vs_average: number;
      distance_from_vwap: number;
    };
    market_regime?: string;
    volatility_regime?: string;
  };
  prediction: {
    price_direction: string;
    confidence_score: number;
    ensemble_agreement: string;
    predicted_move: {
      direction: string;
      magnitude: string;
      target_levels: number[];
      timeframe: string;
    };
    similar_patterns: Array<{
      date: string;
      similarity_score: number;
      outcome: string;
      reasoning: string;
    }>;
    ensemble_breakdown: Array<{
      method: string;
      direction: string;
      confidence: number;
      reasoning: string;
    }>;
    risk_factors: string[];
    trading_recommendation: {
      action: string;
      entry_level: number | null;
      stop_loss: number | null;
      take_profit: number | null;
      position_size: string;
    };
    reasoning: string;
    quality_metrics: {
      meets_confidence_threshold: boolean;
      has_enough_patterns: boolean;
      has_consensus: boolean;
      overall_quality: string;
    };
  };
  historical_patterns_count: number;
  similar_patterns_count: number;
}

export const EnhancedChartPredictor: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState<EnhancedPrediction | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPrediction(null);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = error => reject(error);
    });
  };

  const predictChart = async () => {
    if (!selectedFile) return;

    setPredicting(true);
    try {
      const base64Image = await convertToBase64(selectedFile);
      
      const { data: functionData, error: functionError } = await supabase.functions.invoke('predict-chart-enhanced', {
        body: { 
          image: base64Image,
          filename: selectedFile.name
        }
      });

      if (functionError) {
        throw functionError;
      }

      setPrediction(functionData);
      
      toast({
        title: "Enhanced Prediction Complete",
        description: `${functionData.prediction.ensemble_agreement} on ${functionData.prediction.price_direction} with ${(functionData.prediction.confidence_score * 100).toFixed(0)}% confidence`,
      });
    } catch (error) {
      console.error('Prediction error:', error);
      toast({
        title: "Prediction Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setPredicting(false);
    }
  };

  const getDirectionIcon = (direction: string) => {
    if (direction.toLowerCase().includes('bullish') || direction.toLowerCase().includes('up')) {
      return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    }
    if (direction.toLowerCase().includes('bearish') || direction.toLowerCase().includes('down')) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  const getDirectionColor = (direction: string) => {
    if (direction.toLowerCase().includes('bullish') || direction.toLowerCase().includes('up')) {
      return 'text-emerald-500';
    }
    if (direction.toLowerCase().includes('bearish') || direction.toLowerCase().includes('down')) {
      return 'text-red-500';
    }
    return 'text-muted-foreground';
  };

  const getQualityColor = (quality: string) => {
    if (quality === 'HIGH') return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    if (quality === 'MEDIUM') return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'buy': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'sell': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'hold': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Enhanced AI Prediction Engine
          </CardTitle>
          <CardDescription>
            Multi-method ensemble prediction with technical indicators and pattern matching
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {selectedFile ? selectedFile.name : "Upload current MNQ chart for enhanced prediction"}
                </p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleFileSelect}
              />
            </label>
          </div>

          <Button 
            onClick={predictChart}
            disabled={!selectedFile || predicting}
            className="w-full"
            size="lg"
          >
            {predicting ? "Analyzing with Ensemble Methods..." : "Generate Enhanced Prediction"}
          </Button>

          {predicting && (
            <div className="space-y-2">
              <Progress value={33} className="w-full" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Layers className="h-4 w-4 animate-pulse" />
                Analyzing chart with 4 prediction methods: Pattern Matching, Temporal Analysis, Technical Indicators, AI Vision...
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {prediction && (
        <Tabs defaultValue="prediction" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="prediction">Prediction</TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
            <TabsTrigger value="ensemble">Ensemble</TabsTrigger>
            <TabsTrigger value="track">Track Outcome</TabsTrigger>
          </TabsList>

          <TabsContent value="prediction" className="space-y-4">
            {/* Quality Badge */}
            <Card className={`border-2 ${prediction.prediction.quality_metrics.overall_quality === 'HIGH' ? 'border-emerald-500/30' : 'border-blue-500/30'}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Prediction Result
                  </CardTitle>
                  <Badge className={getQualityColor(prediction.prediction.quality_metrics.overall_quality)}>
                    {prediction.prediction.quality_metrics.overall_quality} QUALITY
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Progress value={prediction.prediction.confidence_score * 100} className="flex-1" />
                  <span className="text-sm font-medium">
                    {(prediction.prediction.confidence_score * 100).toFixed(0)}% Confidence
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Direction & Agreement */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Predicted Direction</h3>
                    <div className="flex items-center gap-2">
                      {getDirectionIcon(prediction.prediction.price_direction)}
                      <span className={`text-2xl font-bold capitalize ${getDirectionColor(prediction.prediction.price_direction)}`}>
                        {prediction.prediction.price_direction}
                      </span>
                      <Badge variant="outline" className="capitalize ml-2">
                        {prediction.prediction.predicted_move.magnitude}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {prediction.prediction.ensemble_agreement}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Trading Recommendation</h3>
                    <Badge className={`text-lg capitalize px-4 py-2 ${getActionColor(prediction.prediction.trading_recommendation.action)}`}>
                      {prediction.prediction.trading_recommendation.action}
                    </Badge>
                    {prediction.prediction.trading_recommendation.entry_level && (
                      <div className="space-y-1 mt-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Entry:</span>
                          <span className="font-mono font-bold">{prediction.prediction.trading_recommendation.entry_level.toFixed(2)}</span>
                        </div>
                        {prediction.prediction.trading_recommendation.stop_loss && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Stop:</span>
                            <span className="font-mono text-red-500">{prediction.prediction.trading_recommendation.stop_loss.toFixed(2)}</span>
                          </div>
                        )}
                        {prediction.prediction.trading_recommendation.take_profit && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Target:</span>
                            <span className="font-mono text-emerald-500">{prediction.prediction.trading_recommendation.take_profit.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Reasoning */}
                <div className="space-y-2">
                  <h3 className="font-medium">Analysis Reasoning</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {prediction.prediction.reasoning}
                  </p>
                </div>

                {/* Risk Factors */}
                {prediction.prediction.risk_factors.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Risk Factors
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {prediction.prediction.risk_factors.map((risk, index) => (
                        <Badge key={index} variant="destructive" className="text-xs">
                          {risk}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quality Metrics */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t">
                  <div className="text-center">
                    <div className={`text-lg font-bold ${prediction.prediction.quality_metrics.meets_confidence_threshold ? 'text-emerald-500' : 'text-orange-500'}`}>
                      {prediction.prediction.quality_metrics.meets_confidence_threshold ? '✓' : '○'}
                    </div>
                    <div className="text-xs text-muted-foreground">Confidence ≥70%</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-bold ${prediction.prediction.quality_metrics.has_enough_patterns ? 'text-emerald-500' : 'text-orange-500'}`}>
                      {prediction.prediction.quality_metrics.has_enough_patterns ? '✓' : '○'}
                    </div>
                    <div className="text-xs text-muted-foreground">≥10 Patterns</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-bold ${prediction.prediction.quality_metrics.has_consensus ? 'text-emerald-500' : 'text-orange-500'}`}>
                      {prediction.prediction.quality_metrics.has_consensus ? '✓' : '○'}
                    </div>
                    <div className="text-xs text-muted-foreground">3+ Methods Agree</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Similar Patterns */}
            {prediction.prediction.similar_patterns.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Similar Historical Patterns</CardTitle>
                  <CardDescription>
                    Found {prediction.similar_patterns_count} similar patterns from {prediction.historical_patterns_count} total analyses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {prediction.prediction.similar_patterns.slice(0, 5).map((pattern, index) => (
                      <div key={index} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{pattern.date}</span>
                          <Badge variant="outline">
                            {(pattern.similarity_score * 100).toFixed(0)}% match
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {getDirectionIcon(pattern.outcome)}
                          <span className={`font-medium capitalize ${getDirectionColor(pattern.outcome)}`}>
                            {pattern.outcome}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{pattern.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="technical">
            <TechnicalIndicatorsDisplay 
              indicators={prediction.current_analysis.technical_indicators}
              marketRegime={{
                regime: prediction.current_analysis.market_regime as any || 'neutral',
                volatility: prediction.current_analysis.volatility_regime as any || 'normal',
                volume: 'average'
              }}
            />
          </TabsContent>

          <TabsContent value="ensemble" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ensemble Methods Breakdown</CardTitle>
                <CardDescription>
                  How each prediction method voted
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {prediction.prediction.ensemble_breakdown.map((method, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold capitalize">{method.method.replace('_', ' ')}</h3>
                        <div className="flex items-center gap-2">
                          {getDirectionIcon(method.direction)}
                          <Badge variant={method.direction === prediction.prediction.price_direction ? 'default' : 'outline'}>
                            {method.direction}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={method.confidence * 100} className="flex-1" />
                        <span className="text-sm font-medium">{(method.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{method.reasoning}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="track">
            <PredictionOutcomeTracker 
              predictedDirection={prediction.prediction.price_direction}
              predictedTarget={prediction.prediction.trading_recommendation.take_profit || undefined}
              predictedTimeframe={30}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
