import React, { useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Target, TrendingUp, Calendar, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface SuccessRateTrackerProps {
  chartAnalysisId: string;
  patternType: string;
  confidence: number;
  predictedDirection?: string;
  className?: string;
  onOutcomeRecorded?: () => void;
}

interface PredictionOutcome {
  id: string;
  predicted_direction: string;
  actual_outcome: string | null;
  outcome_notes: string | null;
  confidence_score: number;
  price_target: number | null;
  actual_price: number | null;
  time_horizon_hours: number;
  predicted_at: string;
  validated_at: string | null;
}

const OUTCOME_OPTIONS = [
  { value: 'success', label: 'Success', icon: CheckCircle2, color: 'text-bullish' },
  { value: 'failure', label: 'Failure', icon: XCircle, color: 'text-bearish' },
  { value: 'partial', label: 'Partial Success', icon: AlertCircle, color: 'text-primary' }
];

const DIRECTION_OPTIONS = [
  { value: 'bullish', label: 'Bullish', color: 'text-bullish' },
  { value: 'bearish', label: 'Bearish', color: 'text-bearish' },
  { value: 'neutral', label: 'Neutral', color: 'text-neutral' }
];

export function SuccessRateTracker({ 
  chartAnalysisId, 
  patternType, 
  confidence, 
  predictedDirection,
  className,
  onOutcomeRecorded 
}: SuccessRateTrackerProps) {
  const [existingOutcome, setExistingOutcome] = useState<PredictionOutcome | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    predicted_direction: predictedDirection || '',
    actual_outcome: '',
    outcome_notes: '',
    price_target: '',
    actual_price: '',
    time_horizon_hours: '24'
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    loadExistingOutcome();
  }, [chartAnalysisId]);

  const loadExistingOutcome = async () => {
    try {
      const { data, error } = await supabase
        .from('prediction_outcomes')
        .select('*')
        .eq('chart_analysis_id', chartAnalysisId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading outcome:', error);
        return;
      }

      if (data) {
        setExistingOutcome(data);
        setFormData({
          predicted_direction: data.predicted_direction,
          actual_outcome: data.actual_outcome || '',
          outcome_notes: data.outcome_notes || '',
          price_target: data.price_target?.toString() || '',
          actual_price: data.actual_price?.toString() || '',
          time_horizon_hours: data.time_horizon_hours.toString()
        });
      }
    } catch (error) {
      console.error('Error loading existing outcome:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.predicted_direction) {
      toast({
        title: "Missing Information",
        description: "Please select a predicted direction.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const outcomeData = {
        chartAnalysisId,
        predictedDirection: formData.predicted_direction,
        actualOutcome: formData.actual_outcome || null,
        outcomeNotes: formData.outcome_notes || null,
        confidenceScore: confidence,
        priceTarget: formData.price_target ? parseFloat(formData.price_target) : null,
        actualPrice: formData.actual_price ? parseFloat(formData.actual_price) : null,
        timeHorizonHours: parseInt(formData.time_horizon_hours)
      };

      const { data, error } = await supabase.functions.invoke('analytics-engine', {
        body: { 
          action: 'record_prediction_outcome',
          data: outcomeData
        }
      });

      if (error) throw error;

      toast({
        title: "Prediction Recorded",
        description: "Your prediction outcome has been successfully recorded.",
      });

      setIsDialogOpen(false);
      onOutcomeRecorded?.();
      loadExistingOutcome();

    } catch (error) {
      console.error('Error recording outcome:', error);
      toast({
        title: "Error Recording Prediction",
        description: "Failed to record the prediction outcome. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getOutcomeDisplay = () => {
    if (!existingOutcome) return null;

    const outcomeOption = OUTCOME_OPTIONS.find(opt => opt.value === existingOutcome.actual_outcome);
    if (!outcomeOption) return null;

    const Icon = outcomeOption.icon;
    return (
      <div className="flex items-center gap-2">
        <Icon className={cn("w-4 h-4", outcomeOption.color)} />
        <Badge variant={existingOutcome.actual_outcome === 'success' ? 'default' : 'secondary'}>
          {outcomeOption.label}
        </Badge>
      </div>
    );
  };

  const getPredictionDisplay = () => {
    const direction = existingOutcome?.predicted_direction || predictedDirection;
    if (!direction) return null;

    const directionOption = DIRECTION_OPTIONS.find(opt => opt.value === direction);
    if (!directionOption) return null;

    return (
      <Badge variant="outline" className={directionOption.color}>
        <TrendingUp className="w-3 h-3 mr-1" />
        {directionOption.label}
      </Badge>
    );
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Success Tracking
          </div>
          {existingOutcome && (
            <div className="text-xs text-muted-foreground">
              {existingOutcome.validated_at ? 'Validated' : 'Pending'}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Pattern:</span>
            <Badge variant="outline">{patternType}</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Confidence:</span>
            <Badge variant="outline">{confidence}%</Badge>
          </div>

          {existingOutcome && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Prediction:</span>
                {getPredictionDisplay()}
              </div>

              {existingOutcome.actual_outcome && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Outcome:</span>
                  {getOutcomeDisplay()}
                </div>
              )}

              {existingOutcome.price_target && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Target:</span>
                  <span className="text-sm font-medium">${existingOutcome.price_target}</span>
                </div>
              )}

              {existingOutcome.actual_price && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Actual:</span>
                  <span className="text-sm font-medium">${existingOutcome.actual_price}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <MessageSquare className="w-4 h-4 mr-2" />
                {existingOutcome ? 'Update Prediction' : 'Record Prediction'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {existingOutcome ? 'Update Prediction' : 'Record Prediction'}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="predicted_direction">Predicted Direction</Label>
                  <Select 
                    value={formData.predicted_direction} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, predicted_direction: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select direction" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIRECTION_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price_target">Price Target</Label>
                    <Input
                      id="price_target"
                      type="number"
                      step="0.01"
                      placeholder="Target price"
                      value={formData.price_target}
                      onChange={(e) => setFormData(prev => ({ ...prev, price_target: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="time_horizon">Time Horizon (hrs)</Label>
                    <Select 
                      value={formData.time_horizon_hours} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, time_horizon_hours: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Hour</SelectItem>
                        <SelectItem value="4">4 Hours</SelectItem>
                        <SelectItem value="24">24 Hours</SelectItem>
                        <SelectItem value="72">3 Days</SelectItem>
                        <SelectItem value="168">1 Week</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {existingOutcome && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="actual_outcome">Actual Outcome</Label>
                      <Select 
                        value={formData.actual_outcome} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, actual_outcome: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select outcome" />
                        </SelectTrigger>
                        <SelectContent>
                          {OUTCOME_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="actual_price">Actual Price</Label>
                      <Input
                        id="actual_price"
                        type="number"
                        step="0.01"
                        placeholder="Actual price reached"
                        value={formData.actual_price}
                        onChange={(e) => setFormData(prev => ({ ...prev, actual_price: e.target.value }))}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="outcome_notes">Notes</Label>
                  <Textarea
                    id="outcome_notes"
                    placeholder="Additional notes about this prediction..."
                    value={formData.outcome_notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, outcome_notes: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? 'Recording...' : 'Record'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}