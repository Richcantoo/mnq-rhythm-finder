import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Target, Brain, Activity, Award, Calendar, Filter, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface AnalyticsDashboardProps {
  className?: string;
}

interface DashboardData {
  totalPatterns: number;
  patternTypeCounts: Record<string, number>;
  confidenceDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  successRate: number;
  recentActivity: number;
  sessionDistribution: Record<string, number>;
  topPatterns: Array<{
    pattern_type: string;
    confidence_score: number;
  }>;
  generatedAt: string;
}

interface SuccessRateData {
  overall_success_rate: number;
  total_predictions: number;
  by_pattern: Record<string, {
    total: number;
    successful: number;
    success_rate: number;
  }>;
  by_confidence: {
    high: { total: number; successful: number; success_rate: number };
    medium: { total: number; successful: number; success_rate: number };
    low: { total: number; successful: number; success_rate: number };
  };
  time_range: string;
}

const COLORS = {
  primary: 'hsl(var(--primary))',
  bullish: 'hsl(var(--bullish))',
  bearish: 'hsl(var(--bearish))',
  neutral: 'hsl(var(--neutral))',
  muted: 'hsl(var(--muted-foreground))'
};

export function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [successRateData, setSuccessRateData] = useState<SuccessRateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const { toast } = useToast();

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);

      // Load dashboard data
      const { data: dashboardResult, error: dashboardError } = await supabase.functions.invoke('analytics-engine', {
        body: { action: 'get_analytics_dashboard' }
      });

      if (dashboardError) throw dashboardError;

      // Load success rate data
      const { data: successResult, error: successError } = await supabase.functions.invoke('analytics-engine', {
        body: { 
          action: 'get_success_rates',
          data: { timeRange }
        }
      });

      if (successError) throw successError;

      setDashboardData(dashboardResult);
      setSuccessRateData(successResult);

    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error Loading Analytics",
        description: "Failed to load analytics data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateClusters = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('analytics-engine', {
        body: { action: 'generate_pattern_clusters' }
      });

      if (error) throw error;

      toast({
        title: "Pattern Clusters Generated",
        description: `Successfully generated ${data.clusters?.length || 0} pattern clusters.`
      });

      // Reload data
      loadAnalyticsData();

    } catch (error) {
      console.error('Error generating clusters:', error);
      toast({
        title: "Error Generating Clusters",
        description: "Failed to generate pattern clusters. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!dashboardData || !successRateData) {
    return (
      <div className={cn("flex items-center justify-center h-64", className)}>
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No analytics data available</p>
          <Button onClick={loadAnalyticsData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Loading
          </Button>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const patternTypeData = Object.entries(dashboardData.patternTypeCounts).map(([type, count]) => ({
    name: type,
    value: count,
    percentage: ((count / dashboardData.totalPatterns) * 100).toFixed(1)
  }));

  const confidenceData = [
    { name: 'High (80%+)', value: dashboardData.confidenceDistribution.high, color: COLORS.bullish },
    { name: 'Medium (60-79%)', value: dashboardData.confidenceDistribution.medium, color: COLORS.primary },
    { name: 'Low (<60%)', value: dashboardData.confidenceDistribution.low, color: COLORS.bearish }
  ];

  const successByPatternData = Object.entries(successRateData.by_pattern).map(([pattern, data]) => ({
    pattern,
    success_rate: data.success_rate,
    total: data.total,
    successful: data.successful
  }));

  const successByConfidenceData = [
    { 
      name: 'High Confidence', 
      success_rate: successRateData.by_confidence.high.success_rate,
      total: successRateData.by_confidence.high.total
    },
    { 
      name: 'Medium Confidence', 
      success_rate: successRateData.by_confidence.medium.success_rate,
      total: successRateData.by_confidence.medium.total
    },
    { 
      name: 'Low Confidence', 
      success_rate: successRateData.by_confidence.low.success_rate,
      total: successRateData.by_confidence.low.total
    }
  ];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Comprehensive pattern analysis insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={generateClusters}>
            <Activity className="w-4 h-4 mr-2" />
            Generate Clusters
          </Button>
          <Button variant="outline" size="sm" onClick={loadAnalyticsData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patterns</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalPatterns}</div>
            <p className="text-xs text-muted-foreground">
              +{dashboardData.recentActivity} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-bullish">
              {successRateData.overall_success_rate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {successRateData.total_predictions} predictions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.topPatterns.length > 0 
                ? (dashboardData.topPatterns.reduce((sum, p) => sum + p.confidence_score, 0) / dashboardData.topPatterns.length).toFixed(1)
                : '0'
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              Top {dashboardData.topPatterns.length} patterns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pattern Types</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(dashboardData.patternTypeCounts).length}</div>
            <p className="text-xs text-muted-foreground">
              Unique patterns detected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="patterns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="patterns">Pattern Analysis</TabsTrigger>
          <TabsTrigger value="success">Success Rates</TabsTrigger>
          <TabsTrigger value="confidence">Confidence Distribution</TabsTrigger>
          <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="patterns" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Pattern Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={patternTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {patternTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Patterns</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboardData.topPatterns.slice(0, 5).map((pattern, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <Badge variant="outline">{pattern.pattern_type}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={pattern.confidence_score} className="w-20" />
                      <span className="text-sm font-medium">{pattern.confidence_score}%</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="success" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Success Rate by Pattern Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={successByPatternData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="pattern" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [`${value}%`, 'Success Rate']}
                      labelFormatter={(label) => `Pattern: ${label}`}
                    />
                    <Bar dataKey="success_rate" fill={COLORS.bullish} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Success Rate by Confidence Level</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={successByConfidenceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [`${value}%`, 'Success Rate']}
                    />
                    <Bar dataKey="success_rate" fill={COLORS.primary} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="confidence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Confidence Score Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={confidenceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill={COLORS.primary} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Overall Success Rate</span>
                    <span className="font-medium">{successRateData.overall_success_rate.toFixed(1)}%</span>
                  </div>
                  <Progress value={successRateData.overall_success_rate} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">High Confidence Success</span>
                    <span className="font-medium">{successRateData.by_confidence.high.success_rate.toFixed(1)}%</span>
                  </div>
                  <Progress value={successRateData.by_confidence.high.success_rate} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Medium Confidence Success</span>
                    <span className="font-medium">{successRateData.by_confidence.medium.success_rate.toFixed(1)}%</span>
                  </div>
                  <Progress value={successRateData.by_confidence.medium.success_rate} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Low Confidence Success</span>
                    <span className="font-medium">{successRateData.by_confidence.low.success_rate.toFixed(1)}%</span>
                  </div>
                  <Progress value={successRateData.by_confidence.low.success_rate} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-bullish/10 rounded-lg">
                  <p className="text-sm font-medium text-bullish">Best Performing Pattern</p>
                  <p className="text-xs text-muted-foreground">
                    {successByPatternData.length > 0 
                      ? successByPatternData.reduce((best, current) => 
                          current.success_rate > best.success_rate ? current : best
                        ).pattern
                      : 'No data available'
                    }
                  </p>
                </div>
                
                <div className="p-3 bg-primary/10 rounded-lg">
                  <p className="text-sm font-medium text-primary">Total Predictions</p>
                  <p className="text-xs text-muted-foreground">
                    {successRateData.total_predictions} predictions in {timeRange}
                  </p>
                </div>

                <div className="p-3 bg-muted/10 rounded-lg">
                  <p className="text-sm font-medium">Confidence Correlation</p>
                  <p className="text-xs text-muted-foreground">
                    Higher confidence patterns show {
                      successRateData.by_confidence.high.success_rate > successRateData.by_confidence.low.success_rate 
                        ? 'better' : 'similar'
                    } success rates
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}