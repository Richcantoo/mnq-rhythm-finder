import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Upload, TrendingUp, TrendingDown, Minus, Target, AlertTriangle, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PredictionResult {
  current_analysis: {
    chart_date: string;
    day_of_week: string;
    price_direction: string;
    momentum: string;
    volume_profile: string;
    session_type: string;
    key_levels: Array<{type: string; price: number; strength: number}>;
    market_sentiment: string;
    volatility: string;
  };
  prediction: {
    price_direction: string;
    confidence_score: number;
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
    risk_factors: string[];
    trading_recommendation: {
      action: string;
      entry_level: number | null;
      stop_loss: number | null;
      take_profit: number | null;
      position_size: string;
    };
    reasoning: string;
  };
  historical_patterns_count: number;
}

const ChartPredictor: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
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

  const savePrediction = async (predictionData: PredictionResult) => {
    try {
      // Find the chart analysis by filename to link the prediction
      const { data: chartAnalysis, error: findError } = await supabase
        .from('chart_analyses')
        .select('id')
        .eq('filename', selectedFile?.name || 'unknown')
        .maybeSingle();

      if (findError) {
        console.error('Error finding chart analysis:', findError);
      }

      // Insert prediction outcome
      const { error: insertError } = await supabase
        .from('prediction_outcomes')
        .insert({
          chart_analysis_id: chartAnalysis?.id,
          predicted_direction: predictionData.prediction.price_direction,
          confidence_score: predictionData.prediction.confidence_score,
          price_target: predictionData.prediction.trading_recommendation.entry_level,
          time_horizon_hours: 24,
          predicted_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Error saving prediction:', insertError);
        toast({
          title: "Warning",
          description: "Prediction generated but failed to save to history",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error in savePrediction:', error);
    }
  };

  const predictChart = async () => {
    if (!selectedFile) return;

    setPredicting(true);
    try {
      const base64Image = await convertToBase64(selectedFile);
      
      const { data: functionData, error: functionError } = await supabase.functions.invoke('predict-chart', {
        body: { 
          image: base64Image,
          filename: selectedFile.name
        }
      });

      if (functionError) {
        throw functionError;
      }

      setPrediction(functionData);
      
      // Store prediction in database
      await savePrediction(functionData);
      
      toast({
        title: "Prediction Complete",
        description: `Analysis generated with ${(functionData.prediction.confidence_score * 100).toFixed(0)}% confidence`,
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
    switch (direction.toLowerCase()) {
      case 'bullish':
      case 'up':
        return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case 'bearish':
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getDirectionColor = (direction: string) => {
    switch (direction.toLowerCase()) {
      case 'bullish':
      case 'up':
        return 'text-emerald-500';
      case 'bearish':
      case 'down':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'buy':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'sell':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'hold':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Chart Prediction
          </CardTitle>
          <CardDescription>
            Upload your current MNQ chart to get AI-powered predictions based on historical patterns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {selectedFile ? selectedFile.name : "Click to upload current chart"}
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
          </div>

          <Button 
            onClick={predictChart}
            disabled={!selectedFile || predicting}
            className="w-full"
          >
            {predicting ? "Analyzing Chart..." : "Generate Prediction"}
          </Button>

          {predicting && (
            <div className="space-y-2">
              <Progress value={33} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                Analyzing current chart and comparing with historical patterns...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {prediction && (
        <div className="space-y-6">
          {/* Current Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Current Chart Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{prediction.current_analysis.chart_date}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Day</p>
                  <p className="font-medium capitalize">{prediction.current_analysis.day_of_week}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Session</p>
                  <p className="font-medium capitalize">{prediction.current_analysis.session_type.replace('-', ' ')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Volatility</p>
                  <Badge variant="outline" className="capitalize">{prediction.current_analysis.volatility}</Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {getDirectionIcon(prediction.current_analysis.price_direction)}
                <span className={`font-medium capitalize ${getDirectionColor(prediction.current_analysis.price_direction)}`}>
                  {prediction.current_analysis.price_direction} Direction
                </span>
                <Badge variant="outline" className="capitalize ml-2">
                  {prediction.current_analysis.momentum} Momentum
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Prediction Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Price Prediction
              </CardTitle>
              <div className="flex items-center gap-2">
                <Progress value={prediction.prediction.confidence_score * 100} className="flex-1" />
                <span className="text-sm font-medium">
                  {(prediction.prediction.confidence_score * 100).toFixed(0)}% Confidence
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {getDirectionIcon(prediction.prediction.predicted_move.direction)}
                    <span className={`text-lg font-semibold capitalize ${getDirectionColor(prediction.prediction.predicted_move.direction)}`}>
                      {prediction.prediction.predicted_move.direction}
                    </span>
                    <Badge variant="outline" className="capitalize">
                      {prediction.prediction.predicted_move.magnitude}
                    </Badge>
                  </div>
                  
                  {prediction.prediction.predicted_move.target_levels.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Target Levels</p>
                      <div className="space-y-1">
                        {prediction.prediction.predicted_move.target_levels.map((level, index) => (
                          <div key={index} className="font-mono text-sm">
                            {level.toFixed(2)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Timeframe</p>
                    <p className="font-medium capitalize">{prediction.prediction.predicted_move.timeframe}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Trading Recommendation</h4>
                  <div className="space-y-3">
                    <Badge className={`capitalize ${getActionColor(prediction.prediction.trading_recommendation.action)}`}>
                      {prediction.prediction.trading_recommendation.action}
                    </Badge>
                    
                    {prediction.prediction.trading_recommendation.entry_level && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Entry</p>
                        <p className="font-mono text-sm">{prediction.prediction.trading_recommendation.entry_level.toFixed(2)}</p>
                      </div>
                    )}
                    
                    {prediction.prediction.trading_recommendation.stop_loss && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Stop Loss</p>
                        <p className="font-mono text-sm">{prediction.prediction.trading_recommendation.stop_loss.toFixed(2)}</p>
                      </div>
                    )}
                    
                    {prediction.prediction.trading_recommendation.take_profit && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Take Profit</p>
                        <p className="font-mono text-sm">{prediction.prediction.trading_recommendation.take_profit.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Analysis Reasoning</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {prediction.prediction.reasoning}
                </p>
              </div>

              {prediction.prediction.risk_factors.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Risk Factors
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {prediction.prediction.risk_factors.map((risk, index) => (
                      <Badge key={index} variant="destructive" className="text-xs">
                        {risk}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Similar Historical Patterns */}
          {prediction.prediction.similar_patterns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Similar Historical Patterns</CardTitle>
                <CardDescription>
                  Found {prediction.prediction.similar_patterns.length} similar patterns from {prediction.historical_patterns_count} historical analyses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {prediction.prediction.similar_patterns.map((pattern, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{pattern.date}</span>
                        <Badge variant="outline">
                          {(pattern.similarity_score * 100).toFixed(0)}% similar
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{pattern.outcome}</p>
                      <p className="text-sm text-muted-foreground">{pattern.reasoning}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default ChartPredictor;