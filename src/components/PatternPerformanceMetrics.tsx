import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Target, Award, AlertTriangle, BarChart3 } from "lucide-react";

interface PatternStats {
  pattern_type: string;
  total_occurrences: number;
  successful_predictions: number;
  failed_predictions: number;
  win_rate: number;
  average_profit_points: number;
  profit_factor: number;
  best_day_of_week?: string;
  best_session_type?: string;
}

export const PatternPerformanceMetrics: React.FC = () => {
  const [patternStats, setPatternStats] = useState<PatternStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallStats, setOverallStats] = useState({
    total_predictions: 0,
    correct_predictions: 0,
    overall_win_rate: 0,
    total_profit_points: 0
  });

  useEffect(() => {
    loadPatternStats();
  }, []);

  const loadPatternStats = async () => {
    try {
      // Fetch prediction feedback data
      const { data: feedbackData, error } = await supabase
        .from('prediction_feedback')
        .select('*')
        .not('actual_direction', 'is', null);

      if (error) {
        console.error('Error fetching feedback:', error);
        setLoading(false);
        return;
      }

      if (!feedbackData || feedbackData.length === 0) {
        setLoading(false);
        return;
      }

      // Calculate overall stats
      const totalPredictions = feedbackData.length;
      const correctPredictions = feedbackData.filter(f => f.was_correct).length;
      const overallWinRate = (correctPredictions / totalPredictions) * 100;
      const totalProfitPoints = feedbackData.reduce((sum, f) => sum + (f.profit_loss_points || 0), 0);

      setOverallStats({
        total_predictions: totalPredictions,
        correct_predictions: correctPredictions,
        overall_win_rate: overallWinRate,
        total_profit_points: totalProfitPoints
      });

      // Group by pattern type
      const patternGroups = feedbackData.reduce((acc: any, item) => {
        const pattern = item.pattern_type || 'unknown';
        if (!acc[pattern]) {
          acc[pattern] = [];
        }
        acc[pattern].push(item);
        return acc;
      }, {});

      // Calculate stats for each pattern
      const stats: PatternStats[] = Object.entries(patternGroups).map(([pattern, items]: [string, any]) => {
        const total = items.length;
        const successful = items.filter((i: any) => i.was_correct).length;
        const failed = total - successful;
        const winRate = (successful / total) * 100;
        
        const profitableItems = items.filter((i: any) => i.profit_loss_points > 0);
        const avgProfit = profitableItems.length > 0
          ? profitableItems.reduce((sum: number, i: any) => sum + i.profit_loss_points, 0) / profitableItems.length
          : 0;

        const totalProfit = items
          .filter((i: any) => i.profit_loss_points > 0)
          .reduce((sum: number, i: any) => sum + i.profit_loss_points, 0);
        const totalLoss = Math.abs(items
          .filter((i: any) => i.profit_loss_points < 0)
          .reduce((sum: number, i: any) => sum + i.profit_loss_points, 0));
        const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0;

        // Find best performing day/session
        const dayPerformance: any = {};
        const sessionPerformance: any = {};

        items.forEach((item: any) => {
          const day = item.conditions?.day_of_week || 'unknown';
          const session = item.conditions?.session_type || 'unknown';

          if (!dayPerformance[day]) dayPerformance[day] = { wins: 0, total: 0 };
          if (!sessionPerformance[session]) sessionPerformance[session] = { wins: 0, total: 0 };

          dayPerformance[day].total++;
          sessionPerformance[session].total++;

          if (item.was_correct) {
            dayPerformance[day].wins++;
            sessionPerformance[session].wins++;
          }
        });

        const bestDay = Object.entries(dayPerformance)
          .map(([day, stats]: [string, any]) => ({
            day,
            winRate: (stats.wins / stats.total) * 100
          }))
          .sort((a, b) => b.winRate - a.winRate)[0]?.day;

        const bestSession = Object.entries(sessionPerformance)
          .map(([session, stats]: [string, any]) => ({
            session,
            winRate: (stats.wins / stats.total) * 100
          }))
          .sort((a, b) => b.winRate - a.winRate)[0]?.session;

        return {
          pattern_type: pattern,
          total_occurrences: total,
          successful_predictions: successful,
          failed_predictions: failed,
          win_rate: winRate,
          average_profit_points: avgProfit,
          profit_factor: profitFactor,
          best_day_of_week: bestDay,
          best_session_type: bestSession
        };
      });

      // Sort by win rate descending
      stats.sort((a, b) => b.win_rate - a.win_rate);

      setPatternStats(stats);
    } catch (error) {
      console.error('Error calculating pattern stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 70) return 'text-emerald-500';
    if (winRate >= 60) return 'text-green-500';
    if (winRate >= 50) return 'text-blue-500';
    if (winRate >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getProfitFactorColor = (pf: number) => {
    if (pf >= 2.0) return 'text-emerald-500';
    if (pf >= 1.5) return 'text-green-500';
    if (pf >= 1.0) return 'text-blue-500';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Pattern Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading pattern statistics...</p>
        </CardContent>
      </Card>
    );
  }

  if (overallStats.total_predictions === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Pattern Performance
          </CardTitle>
          <CardDescription>Track which patterns actually work</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              No prediction outcomes recorded yet.
              <br />
              Start tracking outcomes to see which patterns perform best!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall Performance Summary */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Overall Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{overallStats.total_predictions}</div>
              <div className="text-xs text-muted-foreground">Total Predictions</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className={`text-2xl font-bold ${getWinRateColor(overallStats.overall_win_rate)}`}>
                {overallStats.overall_win_rate.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Win Rate</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-emerald-500">{overallStats.correct_predictions}</div>
              <div className="text-xs text-muted-foreground">Correct</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className={`text-2xl font-bold ${overallStats.total_profit_points >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {overallStats.total_profit_points > 0 ? '+' : ''}{overallStats.total_profit_points.toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground">Total Points</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pattern Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Pattern Performance Breakdown
          </CardTitle>
          <CardDescription>
            Win rates and profitability by pattern type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {patternStats.map((pattern, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold capitalize">{pattern.pattern_type.replace('_', ' ')}</h3>
                    {pattern.win_rate >= 70 && (
                      <Badge variant="default" className="text-xs">
                        <Award className="h-3 w-3 mr-1" />
                        HIGH PERFORMER
                      </Badge>
                    )}
                    {pattern.win_rate < 50 && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        LOW PERFORMER
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-bold ${getWinRateColor(pattern.win_rate)}`}>
                      {pattern.win_rate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {pattern.successful_predictions}/{pattern.total_occurrences}
                    </div>
                  </div>
                </div>

                <Progress value={pattern.win_rate} className="h-2" />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Avg Profit:</span>
                    <div className={`font-bold ${pattern.average_profit_points > 0 ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                      {pattern.average_profit_points > 0 ? '+' : ''}{pattern.average_profit_points.toFixed(1)} pts
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Profit Factor:</span>
                    <div className={`font-bold ${getProfitFactorColor(pattern.profit_factor)}`}>
                      {pattern.profit_factor === 999 ? '∞' : pattern.profit_factor.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Best Day:</span>
                    <div className="font-medium capitalize">{pattern.best_day_of_week || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Best Session:</span>
                    <div className="font-medium capitalize">
                      {pattern.best_session_type?.replace('-', ' ') || 'N/A'}
                    </div>
                  </div>
                </div>

                {pattern.win_rate >= 70 && (
                  <div className="mt-2 p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      ✓ This pattern has excellent performance. Look for these setups!
                    </p>
                  </div>
                )}

                {pattern.win_rate < 50 && (
                  <div className="mt-2 p-2 rounded bg-red-500/10 border border-red-500/20">
                    <p className="text-xs text-red-600 dark:text-red-400">
                      ⚠ This pattern underperforms. Avoid trading these setups or wait for stronger confirmation.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
