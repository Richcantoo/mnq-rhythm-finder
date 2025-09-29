-- Phase 2: AI & Analytics Capabilities Database Schema

-- Create table for tracking prediction outcomes and success rates
CREATE TABLE public.prediction_outcomes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chart_analysis_id UUID REFERENCES public.chart_analyses(id) ON DELETE CASCADE,
  predicted_direction TEXT NOT NULL, -- 'bullish', 'bearish', 'neutral'
  actual_outcome TEXT, -- 'success', 'failure', 'partial'
  outcome_notes TEXT,
  predicted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  validated_at TIMESTAMP WITH TIME ZONE,
  confidence_score NUMERIC NOT NULL DEFAULT 0,
  price_target NUMERIC,
  actual_price NUMERIC,
  time_horizon_hours INTEGER DEFAULT 24,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for pattern similarity scoring and clustering
CREATE TABLE public.pattern_similarities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_chart_id UUID REFERENCES public.chart_analyses(id) ON DELETE CASCADE,
  target_chart_id UUID REFERENCES public.chart_analyses(id) ON DELETE CASCADE,
  similarity_score NUMERIC NOT NULL DEFAULT 0 CHECK (similarity_score >= 0 AND similarity_score <= 100),
  similarity_features JSONB, -- detailed breakdown of what makes patterns similar
  algorithm_used TEXT NOT NULL DEFAULT 'ai_visual', -- 'ai_visual', 'pattern_matching', 'technical_indicators'
  computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure we don't duplicate similarity calculations
  UNIQUE(source_chart_id, target_chart_id, algorithm_used)
);

-- Create table for pattern clusters and groups
CREATE TABLE public.pattern_clusters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cluster_name TEXT NOT NULL,
  cluster_description TEXT,
  cluster_features JSONB, -- characteristics that define this cluster
  confidence_threshold NUMERIC DEFAULT 75,
  success_rate NUMERIC DEFAULT 0,
  total_patterns INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Junction table for patterns in clusters
CREATE TABLE public.pattern_cluster_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cluster_id UUID REFERENCES public.pattern_clusters(id) ON DELETE CASCADE,
  chart_analysis_id UUID REFERENCES public.chart_analyses(id) ON DELETE CASCADE,
  membership_confidence NUMERIC DEFAULT 0 CHECK (membership_confidence >= 0 AND membership_confidence <= 100),
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure a pattern can only be in one cluster at a time
  UNIQUE(chart_analysis_id)
);

-- Create table for analytics aggregations (for performance)
CREATE TABLE public.analytics_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type TEXT NOT NULL, -- 'daily_patterns', 'success_rates', 'confidence_distribution'
  metric_date DATE NOT NULL,
  metric_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(metric_type, metric_date)
);

-- Enable Row Level Security
ALTER TABLE public.prediction_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pattern_similarities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pattern_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pattern_cluster_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prediction_outcomes
CREATE POLICY "Allow all reads for prediction outcomes" 
ON public.prediction_outcomes 
FOR SELECT 
USING (true);

CREATE POLICY "Allow all inserts for prediction outcomes" 
ON public.prediction_outcomes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow all updates for prediction outcomes" 
ON public.prediction_outcomes 
FOR UPDATE 
USING (true);

-- RLS Policies for pattern_similarities
CREATE POLICY "Allow all reads for pattern similarities" 
ON public.pattern_similarities 
FOR SELECT 
USING (true);

CREATE POLICY "Allow all inserts for pattern similarities" 
ON public.pattern_similarities 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for pattern_clusters
CREATE POLICY "Allow all reads for pattern clusters" 
ON public.pattern_clusters 
FOR SELECT 
USING (true);

CREATE POLICY "Allow all inserts for pattern clusters" 
ON public.pattern_clusters 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow all updates for pattern clusters" 
ON public.pattern_clusters 
FOR UPDATE 
USING (true);

-- RLS Policies for pattern_cluster_members
CREATE POLICY "Allow all reads for cluster members" 
ON public.pattern_cluster_members 
FOR SELECT 
USING (true);

CREATE POLICY "Allow all inserts for cluster members" 
ON public.pattern_cluster_members 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow all deletes for cluster members" 
ON public.pattern_cluster_members 
FOR DELETE 
USING (true);

-- RLS Policies for analytics_summaries
CREATE POLICY "Allow all reads for analytics summaries" 
ON public.analytics_summaries 
FOR SELECT 
USING (true);

CREATE POLICY "Allow all inserts for analytics summaries" 
ON public.analytics_summaries 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow all updates for analytics summaries" 
ON public.analytics_summaries 
FOR UPDATE 
USING (true);

-- Create indexes for performance
CREATE INDEX idx_prediction_outcomes_chart_analysis ON public.prediction_outcomes(chart_analysis_id);
CREATE INDEX idx_prediction_outcomes_predicted_at ON public.prediction_outcomes(predicted_at);
CREATE INDEX idx_prediction_outcomes_actual_outcome ON public.prediction_outcomes(actual_outcome);

CREATE INDEX idx_pattern_similarities_source ON public.pattern_similarities(source_chart_id);
CREATE INDEX idx_pattern_similarities_target ON public.pattern_similarities(target_chart_id);
CREATE INDEX idx_pattern_similarities_score ON public.pattern_similarities(similarity_score DESC);

CREATE INDEX idx_pattern_cluster_members_cluster ON public.pattern_cluster_members(cluster_id);
CREATE INDEX idx_pattern_cluster_members_chart ON public.pattern_cluster_members(chart_analysis_id);

CREATE INDEX idx_analytics_summaries_type_date ON public.analytics_summaries(metric_type, metric_date);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_prediction_outcomes_updated_at
BEFORE UPDATE ON public.prediction_outcomes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pattern_clusters_updated_at
BEFORE UPDATE ON public.pattern_clusters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_analytics_summaries_updated_at
BEFORE UPDATE ON public.analytics_summaries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();