-- Create prediction_feedback table for tracking prediction outcomes
CREATE TABLE IF NOT EXISTS public.prediction_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chart_analysis_id UUID REFERENCES public.chart_analyses(id) ON DELETE CASCADE,
  predicted_direction TEXT NOT NULL CHECK (predicted_direction IN ('bullish', 'bearish', 'neutral')),
  predicted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  confidence_score NUMERIC(5,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  actual_direction TEXT CHECK (actual_direction IN ('bullish', 'bearish', 'neutral', 'sideways')),
  actual_high NUMERIC(10,2),
  actual_low NUMERIC(10,2),
  points_moved NUMERIC(10,2),
  outcome_verified_at TIMESTAMP WITH TIME ZONE,
  prediction_correct BOOLEAN,
  ensemble_methods JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create market_regimes table for tracking market conditions
CREATE TABLE IF NOT EXISTS public.market_regimes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regime_name TEXT NOT NULL UNIQUE,
  regime_description TEXT,
  volatility_level TEXT CHECK (volatility_level IN ('low', 'medium', 'high', 'extreme')),
  trend_strength TEXT CHECK (trend_strength IN ('weak', 'moderate', 'strong')),
  volume_characteristic TEXT CHECK (volume_characteristic IN ('low', 'normal', 'high', 'extreme')),
  typical_rsi_range JSONB,
  success_rate NUMERIC(5,2),
  pattern_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pattern_performance table for tracking pattern success metrics
CREATE TABLE IF NOT EXISTS public.pattern_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type TEXT NOT NULL,
  day_of_week TEXT,
  session_type TEXT,
  market_regime TEXT,
  total_predictions INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  success_rate NUMERIC(5,2),
  avg_confidence NUMERIC(5,2),
  avg_points_moved NUMERIC(10,2),
  best_performing_time TEXT,
  worst_performing_time TEXT,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(pattern_type, day_of_week, session_type, market_regime)
);

-- Enable RLS
ALTER TABLE public.prediction_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_regimes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pattern_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prediction_feedback
CREATE POLICY "Allow all reads for prediction feedback"
  ON public.prediction_feedback FOR SELECT
  USING (true);

CREATE POLICY "Allow all inserts for prediction feedback"
  ON public.prediction_feedback FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all updates for prediction feedback"
  ON public.prediction_feedback FOR UPDATE
  USING (true);

-- RLS Policies for market_regimes
CREATE POLICY "Allow all reads for market regimes"
  ON public.market_regimes FOR SELECT
  USING (true);

CREATE POLICY "Allow all inserts for market regimes"
  ON public.market_regimes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all updates for market regimes"
  ON public.market_regimes FOR UPDATE
  USING (true);

-- RLS Policies for pattern_performance
CREATE POLICY "Allow all reads for pattern performance"
  ON public.pattern_performance FOR SELECT
  USING (true);

CREATE POLICY "Allow all inserts for pattern performance"
  ON public.pattern_performance FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all updates for pattern performance"
  ON public.pattern_performance FOR UPDATE
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_prediction_feedback_chart_analysis ON public.prediction_feedback(chart_analysis_id);
CREATE INDEX IF NOT EXISTS idx_prediction_feedback_predicted_at ON public.prediction_feedback(predicted_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_regimes_name ON public.market_regimes(regime_name);
CREATE INDEX IF NOT EXISTS idx_pattern_performance_lookup ON public.pattern_performance(pattern_type, day_of_week, session_type);

-- Create trigger for updated_at
CREATE TRIGGER update_prediction_feedback_updated_at
  BEFORE UPDATE ON public.prediction_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_market_regimes_updated_at
  BEFORE UPDATE ON public.market_regimes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();