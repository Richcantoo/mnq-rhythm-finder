-- Add technical indicators and enhanced analysis columns to chart_analyses
ALTER TABLE public.chart_analyses
ADD COLUMN IF NOT EXISTS rsi_value FLOAT,
ADD COLUMN IF NOT EXISTS atr_value FLOAT,
ADD COLUMN IF NOT EXISTS macd_value FLOAT,
ADD COLUMN IF NOT EXISTS macd_signal FLOAT,
ADD COLUMN IF NOT EXISTS macd_histogram FLOAT,
ADD COLUMN IF NOT EXISTS volume_vs_average FLOAT,
ADD COLUMN IF NOT EXISTS distance_from_vwap FLOAT,
ADD COLUMN IF NOT EXISTS market_regime TEXT CHECK (market_regime IN ('strong_bull', 'weak_bull', 'neutral', 'weak_bear', 'strong_bear')),
ADD COLUMN IF NOT EXISTS volatility_regime TEXT CHECK (volatility_regime IN ('high', 'normal', 'low')),
ADD COLUMN IF NOT EXISTS volume_regime TEXT CHECK (volume_regime IN ('above_average', 'average', 'below_average')),
ADD COLUMN IF NOT EXISTS timeframe_alignment JSONB,
ADD COLUMN IF NOT EXISTS support_levels JSONB,
ADD COLUMN IF NOT EXISTS resistance_levels JSONB,
ADD COLUMN IF NOT EXISTS order_blocks JSONB,
ADD COLUMN IF NOT EXISTS actual_outcome TEXT,
ADD COLUMN IF NOT EXISTS outcome_price_move FLOAT,
ADD COLUMN IF NOT EXISTS outcome_measured_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS prediction_accuracy FLOAT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chart_analyses_rsi ON public.chart_analyses(rsi_value);
CREATE INDEX IF NOT EXISTS idx_chart_analyses_market_regime ON public.chart_analyses(market_regime);
CREATE INDEX IF NOT EXISTS idx_chart_analyses_volatility_regime ON public.chart_analyses(volatility_regime);
CREATE INDEX IF NOT EXISTS idx_chart_analyses_actual_outcome ON public.chart_analyses(actual_outcome);

COMMENT ON COLUMN public.chart_analyses.rsi_value IS 'RSI (Relative Strength Index) value from 0-100';
COMMENT ON COLUMN public.chart_analyses.atr_value IS 'Average True Range - volatility measurement';
COMMENT ON COLUMN public.chart_analyses.macd_value IS 'MACD line value for trend detection';
COMMENT ON COLUMN public.chart_analyses.volume_vs_average IS 'Current volume compared to 20-period average';
COMMENT ON COLUMN public.chart_analyses.market_regime IS 'Overall market condition classification';
COMMENT ON COLUMN public.chart_analyses.timeframe_alignment IS 'JSON showing 5min, 15min, 60min alignment';
COMMENT ON COLUMN public.chart_analyses.actual_outcome IS 'What actually happened after prediction';
