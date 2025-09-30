-- Add sentiment_label column to chart_analyses table to store bullish/bearish/neutral classification
ALTER TABLE public.chart_analyses
ADD COLUMN sentiment_label TEXT CHECK (sentiment_label IN ('bullish', 'bearish', 'neutral'));

-- Add an index for filtering by sentiment
CREATE INDEX IF NOT EXISTS idx_chart_analyses_sentiment_label ON public.chart_analyses(sentiment_label);

COMMENT ON COLUMN public.chart_analyses.sentiment_label IS 'AI-determined market sentiment based on price action: bullish, bearish, or neutral';