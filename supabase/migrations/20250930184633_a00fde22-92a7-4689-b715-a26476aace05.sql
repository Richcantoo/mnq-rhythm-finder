-- Add technical indicator columns to chart_analyses table
ALTER TABLE chart_analyses 
ADD COLUMN IF NOT EXISTS rsi_value numeric,
ADD COLUMN IF NOT EXISTS atr_value numeric,
ADD COLUMN IF NOT EXISTS macd_value numeric,
ADD COLUMN IF NOT EXISTS macd_signal numeric,
ADD COLUMN IF NOT EXISTS macd_histogram numeric,
ADD COLUMN IF NOT EXISTS volume_vs_average numeric,
ADD COLUMN IF NOT EXISTS distance_from_vwap numeric,
ADD COLUMN IF NOT EXISTS market_regime text,
ADD COLUMN IF NOT EXISTS volatility_regime text,
ADD COLUMN IF NOT EXISTS volume_regime text,
ADD COLUMN IF NOT EXISTS timeframe_alignment jsonb,
ADD COLUMN IF NOT EXISTS support_levels jsonb,
ADD COLUMN IF NOT EXISTS resistance_levels jsonb;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chart_analyses_rsi ON chart_analyses(rsi_value);
CREATE INDEX IF NOT EXISTS idx_chart_analyses_market_regime ON chart_analyses(market_regime);
CREATE INDEX IF NOT EXISTS idx_chart_analyses_created_at ON chart_analyses(created_at DESC);