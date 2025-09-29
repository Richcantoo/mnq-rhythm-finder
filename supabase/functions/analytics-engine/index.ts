import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let result = {};

    switch (action) {
      case 'get_analytics_dashboard':
        result = await getAnalyticsDashboard(supabase);
        break;
        
      case 'record_prediction_outcome':
        result = await recordPredictionOutcome(supabase, data);
        break;
        
      case 'generate_pattern_clusters':
        result = await generatePatternClusters(supabase);
        break;
        
      case 'get_success_rates':
        result = await getSuccessRates(supabase, data);
        break;
        
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analytics function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getAnalyticsDashboard(supabase: any) {
  try {
    // Get total patterns analyzed
    const { count: totalPatterns } = await supabase
      .from('chart_analyses')
      .select('*', { count: 'exact', head: true });

    // Get patterns by type
    const { data: patternTypes } = await supabase
      .from('chart_analyses')
      .select('pattern_type')
      .order('pattern_type');

    const patternTypeCounts = patternTypes?.reduce((acc: any, pattern: any) => {
      acc[pattern.pattern_type] = (acc[pattern.pattern_type] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get confidence distribution
    const { data: confidenceData } = await supabase
      .from('chart_analyses')
      .select('confidence_score');

    const confidenceDistribution = {
      high: confidenceData?.filter((c: any) => c.confidence_score >= 80).length || 0,
      medium: confidenceData?.filter((c: any) => c.confidence_score >= 60 && c.confidence_score < 80).length || 0,
      low: confidenceData?.filter((c: any) => c.confidence_score < 60).length || 0
    };

    // Get success rates
    const { data: outcomes } = await supabase
      .from('prediction_outcomes')
      .select('*');

    const successRate = outcomes?.length ? 
      (outcomes.filter((o: any) => o.actual_outcome === 'success').length / outcomes.length) * 100 : 0;

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: recentPatterns } = await supabase
      .from('chart_analyses')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    // Get session time distribution
    const { data: sessionData } = await supabase
      .from('chart_analyses')
      .select('session_details');

    const sessionDistribution = sessionData?.reduce((acc: any, session: any) => {
      const sessionTime = session.session_details?.session_time || 'Unknown';
      acc[sessionTime] = (acc[sessionTime] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get top performing patterns
    const { data: topPatterns } = await supabase
      .from('chart_analyses')
      .select('pattern_type, confidence_score')
      .order('confidence_score', { ascending: false })
      .limit(10);

    return {
      totalPatterns: totalPatterns || 0,
      patternTypeCounts,
      confidenceDistribution,
      successRate: Math.round(successRate * 100) / 100,
      recentActivity: recentPatterns || 0,
      sessionDistribution,
      topPatterns: topPatterns || [],
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error generating analytics dashboard:', error);
    throw error;
  }
}

async function recordPredictionOutcome(supabase: any, data: any) {
  try {
    const {
      chartAnalysisId,
      predictedDirection,
      actualOutcome,
      outcomeNotes,
      confidenceScore,
      priceTarget,
      actualPrice,
      timeHorizonHours
    } = data;

    const { data: outcome, error } = await supabase
      .from('prediction_outcomes')
      .insert({
        chart_analysis_id: chartAnalysisId,
        predicted_direction: predictedDirection,
        actual_outcome: actualOutcome,
        outcome_notes: outcomeNotes,
        confidence_score: confidenceScore,
        price_target: priceTarget,
        actual_price: actualPrice,
        time_horizon_hours: timeHorizonHours,
        validated_at: actualOutcome ? new Date().toISOString() : null
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, outcome };

  } catch (error) {
    console.error('Error recording prediction outcome:', error);
    throw error;
  }
}

async function generatePatternClusters(supabase: any) {
  try {
    // Get all chart analyses
    const { data: charts } = await supabase
      .from('chart_analyses')
      .select('*');

    if (!charts || charts.length === 0) {
      return { clusters: [], message: 'No charts available for clustering' };
    }

    // Group by pattern type first
    const patternGroups = charts.reduce((acc: any, chart: any) => {
      const pattern = chart.pattern_type;
      if (!acc[pattern]) {
        acc[pattern] = [];
      }
      acc[pattern].push(chart);
      return acc;
    }, {});

    const clusters = [];

    for (const [patternType, patternCharts] of Object.entries(patternGroups)) {
      const chartArray = patternCharts as any[];
      
      if (chartArray.length < 2) continue; // Skip patterns with only 1 instance

      // Create cluster for this pattern type
      const avgConfidence = chartArray.reduce((sum: number, chart: any) => 
        sum + chart.confidence_score, 0) / chartArray.length;

      // Get success rate for this pattern
      const { data: outcomes } = await supabase
        .from('prediction_outcomes')
        .select('actual_outcome')
        .in('chart_analysis_id', chartArray.map((c: any) => c.id));

      const successRate = outcomes?.length ? 
        (outcomes.filter((o: any) => o.actual_outcome === 'success').length / outcomes.length) * 100 : 0;

      // Create or update cluster
      const { data: cluster, error: clusterError } = await supabase
        .from('pattern_clusters')
        .upsert({
          cluster_name: `${patternType} Cluster`,
          cluster_description: `Automated cluster for ${patternType} patterns`,
          cluster_features: {
            pattern_type: patternType,
            avg_confidence: avgConfidence,
            member_count: chartArray.length,
            confidence_range: {
              min: Math.min(...chartArray.map((c: any) => c.confidence_score)),
              max: Math.max(...chartArray.map((c: any) => c.confidence_score))
            }
          },
          confidence_threshold: Math.max(60, avgConfidence - 10),
          success_rate: successRate,
          total_patterns: chartArray.length
        }, {
          onConflict: 'cluster_name'
        })
        .select()
        .single();

      if (clusterError) {
        console.error('Error creating cluster:', clusterError);
        continue;
      }

      // Add charts to cluster
      for (const chart of chartArray) {
        await supabase
          .from('pattern_cluster_members')
          .upsert({
            cluster_id: cluster.id,
            chart_analysis_id: chart.id,
            membership_confidence: chart.confidence_score
          }, {
            onConflict: 'chart_analysis_id'
          });
      }

      clusters.push({
        ...cluster,
        member_charts: chartArray.length
      });
    }

    return { 
      clusters, 
      message: `Generated ${clusters.length} pattern clusters`,
      total_charts_clustered: charts.length
    };

  } catch (error) {
    console.error('Error generating pattern clusters:', error);
    throw error;
  }
}

async function getSuccessRates(supabase: any, data: any) {
  try {
    const { patternType, timeRange = '30d' } = data || {};

    let query = supabase
      .from('prediction_outcomes')
      .select(`
        *,
        chart_analyses(pattern_type, confidence_score)
      `);

    // Add time filter
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    query = query.gte('predicted_at', startDate.toISOString());

    if (patternType) {
      query = query.eq('chart_analyses.pattern_type', patternType);
    }

    const { data: outcomes } = await query;

    if (!outcomes || outcomes.length === 0) {
      return {
        overall_success_rate: 0,
        total_predictions: 0,
        by_pattern: {},
        by_confidence: {},
        time_range: timeRange
      };
    }

    // Calculate overall success rate
    const successful = outcomes.filter((o: any) => o.actual_outcome === 'success').length;
    const overallSuccessRate = (successful / outcomes.length) * 100;

    // Success rate by pattern type
    const byPattern = outcomes.reduce((acc: any, outcome: any) => {
      const pattern = outcome.chart_analyses?.pattern_type || 'Unknown';
      if (!acc[pattern]) {
        acc[pattern] = { total: 0, successful: 0 };
      }
      acc[pattern].total++;
      if (outcome.actual_outcome === 'success') {
        acc[pattern].successful++;
      }
      return acc;
    }, {});

    // Convert to success rates
    Object.keys(byPattern).forEach(pattern => {
      const data = byPattern[pattern];
      byPattern[pattern].success_rate = (data.successful / data.total) * 100;
    });

    // Success rate by confidence ranges
    const byConfidence = {
      high: { total: 0, successful: 0 }, // 80+
      medium: { total: 0, successful: 0 }, // 60-79
      low: { total: 0, successful: 0 } // <60
    };

    outcomes.forEach((outcome: any) => {
      const confidence = outcome.confidence_score || 0;
      let range = 'low';
      if (confidence >= 80) range = 'high';
      else if (confidence >= 60) range = 'medium';

      byConfidence[range as keyof typeof byConfidence].total++;
      if (outcome.actual_outcome === 'success') {
        byConfidence[range as keyof typeof byConfidence].successful++;
      }
    });

    // Convert to success rates
    Object.keys(byConfidence).forEach(range => {
      const data = byConfidence[range as keyof typeof byConfidence];
      if (data.total > 0) {
        (byConfidence[range as keyof typeof byConfidence] as any).success_rate = (data.successful / data.total) * 100;
      } else {
        (byConfidence[range as keyof typeof byConfidence] as any).success_rate = 0;
      }
    });

    return {
      overall_success_rate: Math.round(overallSuccessRate * 100) / 100,
      total_predictions: outcomes.length,
      by_pattern: byPattern,
      by_confidence: byConfidence,
      time_range: timeRange
    };

  } catch (error) {
    console.error('Error getting success rates:', error);
    throw error;
  }
}