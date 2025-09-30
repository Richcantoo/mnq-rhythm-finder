import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, TrendingUp, TrendingDown, Target, DollarSign } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PredictionOutcomeTrackerProps {
  predictionId?: string;
  predictedDirection: string;
  predictedTarget?: number;
  predictedTimeframe?: number;
}

export const PredictionOutcomeTracker: React.FC<PredictionOutcomeTrackerProps> = ({
  predictionId,
  predictedDirection,
  predictedTarget,
  predictedTimeframe
}) => {
  const [actualDirection, setActualDirection] = useState<string>('');
  const [actualHigh, setActualHigh] = useState<string>('');
  const [actualLow, setActualLow] = useState<string>('');
  const [actualMove, setActualMove] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmitOutcome = async () => {
    if (!actualDirection || !actualMove) {
      toast({
        title: "Missing Information",
        description: "Please provide actual direction and price move",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      const wasCorrect = actualDirection.toLowerCase() === predictedDirection.toLowerCase();
      const profitLossPoints = parseFloat(actualMove);
      const accuracyScore = wasCorrect ? 1.0 : 0.0;

      const { error } = await supabase
        .from('prediction_feedback')
        .insert({
          predicted_direction: predictedDirection,
          predicted_price_target: predictedTarget,
          predicted_timeframe_minutes: predictedTimeframe || 30,
          actual_direction: actualDirection,
          actual_price_move: profitLossPoints,
          actual_high: actualHigh ? parseFloat(actualHigh) : null,
          actual_low: actualLow ? parseFloat(actualLow) : null,
          outcome_measured_at: new Date().toISOString(),
          was_correct: wasCorrect,
          accuracy_score: accuracyScore,
          profit_loss_points: wasCorrect ? Math.abs(profitLossPoints) : -Math.abs(profitLossPoints),
        });

      if (error) {
        throw error;
      }

      toast({
        title: wasCorrect ? "Correct Prediction! ✓" : "Incorrect Prediction",
        description: `Prediction was ${wasCorrect ? 'accurate' : 'inaccurate'}. Data saved for learning.`,
        variant: wasCorrect ? "default" : "destructive"
      });

      // Reset form
      setActualDirection('');
      setActualHigh('');
      setActualLow('');
      setActualMove('');

    } catch (error) {
      console.error('Error submitting outcome:', error);
      toast({
        title: "Error",
        description: "Failed to save outcome data",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Track Prediction Outcome
        </CardTitle>
        <CardDescription>
          Record what actually happened to improve future predictions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-muted/50">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Predicted Direction:</span>
              <Badge variant={predictedDirection === 'bullish' ? 'default' : 'destructive'}>
                {predictedDirection === 'bullish' && <TrendingUp className="h-3 w-3 mr-1" />}
                {predictedDirection === 'bearish' && <TrendingDown className="h-3 w-3 mr-1" />}
                {predictedDirection.toUpperCase()}
              </Badge>
            </div>
            {predictedTarget && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Price Target:</span>
                <span className="font-mono font-bold">{predictedTarget.toFixed(2)}</span>
              </div>
            )}
            {predictedTimeframe && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Timeframe:</span>
                <span className="font-medium">{predictedTimeframe} minutes</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="actual-direction">Actual Direction *</Label>
            <Select value={actualDirection} onValueChange={setActualDirection}>
              <SelectTrigger id="actual-direction">
                <SelectValue placeholder="What actually happened?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bullish">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    Bullish (Price went up)
                  </div>
                </SelectItem>
                <SelectItem value="bearish">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    Bearish (Price went down)
                  </div>
                </SelectItem>
                <SelectItem value="neutral">
                  <div className="flex items-center gap-2">
                    Neutral (Sideways movement)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="actual-high">Actual High</Label>
              <Input
                id="actual-high"
                type="number"
                step="0.01"
                placeholder="16050.00"
                value={actualHigh}
                onChange={(e) => setActualHigh(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actual-low">Actual Low</Label>
              <Input
                id="actual-low"
                type="number"
                step="0.01"
                placeholder="15950.00"
                value={actualLow}
                onChange={(e) => setActualLow(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="actual-move">Price Move (Points) *</Label>
            <Input
              id="actual-move"
              type="number"
              step="0.01"
              placeholder="e.g., 25.50 or -15.75"
              value={actualMove}
              onChange={(e) => setActualMove(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Enter positive for gains, negative for losses
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleSubmitOutcome}
            disabled={submitting || !actualDirection || !actualMove}
            className="flex-1"
          >
            {submitting ? "Saving..." : "Submit Outcome"}
          </Button>
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            <strong>Why track outcomes?</strong> Every outcome you record helps the AI learn which patterns actually work vs which don't. This creates a feedback loop that continuously improves prediction accuracy.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
