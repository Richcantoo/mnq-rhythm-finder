import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { History, TrendingUp, TrendingDown, Minus, CheckCircle, XCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PredictionRecord {
  id: string;
  predicted_direction: string;
  confidence_score: number;
  price_target: number | null;
  predicted_at: string;
  actual_outcome: string | null;
  actual_price: number | null;
  validated_at: string | null;
  time_horizon_hours: number;
  chart_analysis_id: string;
}

const PredictionHistory: React.FC = () => {
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    try {
      const { data, error } = await supabase
        .from('prediction_outcomes')
        .select('*')
        .order('predicted_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setPredictions(data || []);
    } catch (error) {
      console.error('Error loading predictions:', error);
    } finally {
      setLoading(false);
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

  const getOutcomeIcon = (actual: string | null, predicted: string) => {
    if (!actual) return <Clock className="h-4 w-4 text-muted-foreground" />;
    
    const match = actual.toLowerCase() === predicted.toLowerCase();
    return match 
      ? <CheckCircle className="h-4 w-4 text-emerald-500" />
      : <XCircle className="h-4 w-4 text-red-500" />;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading predictions...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Prediction History
        </CardTitle>
        <CardDescription>
          Track and validate your trading predictions over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        {predictions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No predictions yet. Generate your first prediction to see it here.
          </p>
        ) : (
          <div className="space-y-4">
            {predictions.map((pred) => (
              <div key={pred.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getDirectionIcon(pred.predicted_direction)}
                    <span className="font-medium capitalize">{pred.predicted_direction}</span>
                  </div>
                  <Badge variant="outline">
                    {(pred.confidence_score * 100).toFixed(0)}%
                  </Badge>
                </div>

                {pred.price_target && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Target: </span>
                    <span className="font-mono">{pred.price_target.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {getOutcomeIcon(pred.actual_outcome, pred.predicted_direction)}
                    {pred.actual_outcome ? (
                      <span className="capitalize">{pred.actual_outcome}</span>
                    ) : (
                      <span className="text-muted-foreground">Pending validation</span>
                    )}
                  </div>
                  <span className="text-muted-foreground">
                    {formatDistanceToNow(new Date(pred.predicted_at), { addSuffix: true })}
                  </span>
                </div>

                {pred.actual_price && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Actual: </span>
                    <span className="font-mono">{pred.actual_price.toFixed(2)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PredictionHistory;
