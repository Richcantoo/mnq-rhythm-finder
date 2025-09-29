import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Brain, Eye, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface PatternSimilarityProps {
  sourceChartId: string;
  sourcePattern: string;
  targetChartIds: string[];
  className?: string;
}

interface SimilarityResult {
  id: string;
  source_chart_id: string;
  target_chart_id: string;
  similarity_score: number;
  similarity_features: {
    pattern_match?: number;
    technical_similarity?: number;
    context_similarity?: number;
    confidence_correlation?: number;
    reasoning?: string;
    algorithm?: string;
  };
  algorithm_used: string;
  computed_at: string;
}

interface ChartAnalysis {
  id: string;
  pattern_type: string;
  confidence_score: number;
  filename: string;
  session_details?: any;
}

export function PatternSimilarity({ 
  sourceChartId, 
  sourcePattern, 
  targetChartIds, 
  className 
}: PatternSimilarityProps) {
  const [similarities, setSimilarities] = useState<SimilarityResult[]>([]);
  const [chartDetails, setChartDetails] = useState<Record<string, ChartAnalysis>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSimilarity, setSelectedSimilarity] = useState<SimilarityResult | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (targetChartIds.length > 0) {
      loadChartDetails();
    }
  }, [targetChartIds]);

  const loadChartDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('chart_analyses')
        .select('id, pattern_type, confidence_score, filename, session_details')
        .in('id', [sourceChartId, ...targetChartIds]);

      if (error) throw error;

      const detailsMap = data.reduce((acc: Record<string, ChartAnalysis>, chart: ChartAnalysis) => {
        acc[chart.id] = chart;
        return acc;
      }, {});

      setChartDetails(detailsMap);
    } catch (error) {
      console.error('Error loading chart details:', error);
    }
  };

  const computeSimilarities = async () => {
    if (targetChartIds.length === 0) {
      toast({
        title: "No Target Charts",
        description: "Please select charts to compare against.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('pattern-similarity', {
        body: {
          sourceImageId: sourceChartId,
          targetImageIds: targetChartIds,
          algorithm: 'ai_visual'
        }
      });

      if (error) throw error;

      setSimilarities(data.similarities || []);
      
      toast({
        title: "Similarity Analysis Complete",
        description: `Found ${data.similarities?.length || 0} similar patterns.`
      });

    } catch (error) {
      console.error('Error computing similarities:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to compute pattern similarities. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSimilarityColor = (score: number) => {
    if (score >= 80) return 'text-bullish';
    if (score >= 60) return 'text-primary';
    if (score >= 40) return 'text-neutral';
    return 'text-bearish';
  };

  const getSimilarityBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'outline';
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Pattern Similarity Analysis
            </div>
            <Button 
              onClick={computeSimilarities} 
              disabled={isLoading || targetChartIds.length === 0}
              size="sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4 mr-2" />
                  Find Similar Patterns
                </>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div>Source Pattern: <Badge variant="outline">{sourcePattern}</Badge></div>
            <div>Target Charts: {targetChartIds.length}</div>
            {similarities.length > 0 && (
              <div>Found: {similarities.length} similar patterns</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Similarity Results */}
      {similarities.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Top Similar Patterns</h3>
          <div className="grid gap-3">
            {similarities.slice(0, 5).map((similarity, index) => {
              const targetChart = chartDetails[similarity.target_chart_id];
              if (!targetChart) return null;

              return (
                <Card key={similarity.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-lg font-bold text-primary">#{index + 1}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{targetChart.pattern_type}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {targetChart.confidence_score}% confidence
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {targetChart.filename}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className={cn("text-lg font-bold", getSimilarityColor(similarity.similarity_score))}>
                            {similarity.similarity_score.toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">similarity</div>
                        </div>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedSimilarity(similarity)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Similarity Analysis Details</DialogTitle>
                            </DialogHeader>
                            {selectedSimilarity && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <h4 className="font-medium">Source Pattern</h4>
                                    <Badge variant="outline">{sourcePattern}</Badge>
                                  </div>
                                  <div className="space-y-2">
                                    <h4 className="font-medium">Target Pattern</h4>
                                    <Badge variant="outline">{targetChart.pattern_type}</Badge>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <h4 className="font-medium">Similarity Breakdown</h4>
                                  
                                  {selectedSimilarity.similarity_features.pattern_match !== undefined && (
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-sm">
                                        <span>Pattern Match</span>
                                        <span>{selectedSimilarity.similarity_features.pattern_match.toFixed(1)}%</span>
                                      </div>
                                      <Progress value={selectedSimilarity.similarity_features.pattern_match} />
                                    </div>
                                  )}

                                  {selectedSimilarity.similarity_features.technical_similarity !== undefined && (
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-sm">
                                        <span>Technical Similarity</span>
                                        <span>{selectedSimilarity.similarity_features.technical_similarity.toFixed(1)}%</span>
                                      </div>
                                      <Progress value={selectedSimilarity.similarity_features.technical_similarity} />
                                    </div>
                                  )}

                                  {selectedSimilarity.similarity_features.context_similarity !== undefined && (
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-sm">
                                        <span>Context Similarity</span>
                                        <span>{selectedSimilarity.similarity_features.context_similarity.toFixed(1)}%</span>
                                      </div>
                                      <Progress value={selectedSimilarity.similarity_features.context_similarity} />
                                    </div>
                                  )}

                                  {selectedSimilarity.similarity_features.confidence_correlation !== undefined && (
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-sm">
                                        <span>Confidence Correlation</span>
                                        <span>{selectedSimilarity.similarity_features.confidence_correlation.toFixed(1)}%</span>
                                      </div>
                                      <Progress value={selectedSimilarity.similarity_features.confidence_correlation} />
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-2">
                                  <h4 className="font-medium">Overall Similarity</h4>
                                  <div className="flex items-center gap-3">
                                    <Progress value={selectedSimilarity.similarity_score} className="flex-1" />
                                    <Badge variant={getSimilarityBadgeVariant(selectedSimilarity.similarity_score)}>
                                      {selectedSimilarity.similarity_score.toFixed(1)}%
                                    </Badge>
                                  </div>
                                </div>

                                {selectedSimilarity.similarity_features.reasoning && (
                                  <div className="space-y-2">
                                    <h4 className="font-medium">AI Analysis</h4>
                                    <p className="text-sm text-muted-foreground p-3 bg-muted/20 rounded-lg">
                                      {selectedSimilarity.similarity_features.reasoning}
                                    </p>
                                  </div>
                                )}

                                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                                  <span>Algorithm: {selectedSimilarity.algorithm_used}</span>
                                  <span>Computed: {new Date(selectedSimilarity.computed_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    {/* Quick similarity breakdown */}
                    <div className="mt-3 pt-3 border-t">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        {similarity.similarity_features.pattern_match !== undefined && (
                          <div className="text-center">
                            <div className="font-medium">{similarity.similarity_features.pattern_match.toFixed(0)}%</div>
                            <div className="text-muted-foreground">Pattern</div>
                          </div>
                        )}
                        {similarity.similarity_features.technical_similarity !== undefined && (
                          <div className="text-center">
                            <div className="font-medium">{similarity.similarity_features.technical_similarity.toFixed(0)}%</div>
                            <div className="text-muted-foreground">Technical</div>
                          </div>
                        )}
                        {similarity.similarity_features.context_similarity !== undefined && (
                          <div className="text-center">
                            <div className="font-medium">{similarity.similarity_features.context_similarity.toFixed(0)}%</div>
                            <div className="text-muted-foreground">Context</div>
                          </div>
                        )}
                        {similarity.similarity_features.confidence_correlation !== undefined && (
                          <div className="text-center">
                            <div className="font-medium">{similarity.similarity_features.confidence_correlation.toFixed(0)}%</div>
                            <div className="text-muted-foreground">Confidence</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && similarities.length === 0 && targetChartIds.length > 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No similarity analysis performed yet.
            </p>
            <Button onClick={computeSimilarities} disabled={isLoading}>
              <Target className="w-4 h-4 mr-2" />
              Start Analysis
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}