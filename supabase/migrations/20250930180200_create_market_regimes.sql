-- Create market_regimes table for tracking market conditions
CREATE TABLE IF NOT EXISTS public.market_regimes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Timeframe
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    timeframe TEXT NOT NULL CHECK (timeframe IN ('5min', '15min', '60min', 'daily')),
    
    -- Market classification
    regime_type TEXT NOT NULL CHECK (regime_type IN ('strong_bull', 'weak_bull', 'neutral', 'weak_bear', 'strong_bear')),
    volatility_regime TEXT NOT NULL CHECK (volatility_regime IN ('high', 'normal', 'low')),
    volume_regime TEXT NOT NULL CHECK (volume_regime IN ('above_average', 'average', 'below_average')),
    
    -- Quantitative metrics
    atr_value FLOAT,
    vix_level FLOAT,
    trend_strength FLOAT,
    volume_ratio FLOAT,
    
    -- Additional context
    is_news_event BOOLEAN DEFAULT false,
    news_impact TEXT CHECK (news_impact IN ('high', 'medium', 'low', 'none')),
    session_type TEXT CHECK (session_type IN ('pre-market', 'market-open', 'lunch', 'power-hour', 'after-hours')),
    
    -- Metadata
    metadata JSONB
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_market_regimes_timestamp ON public.market_regimes(timestamp);
CREATE INDEX IF NOT EXISTS idx_market_regimes_timeframe ON public.market_regimes(timeframe);
CREATE INDEX IF NOT EXISTS idx_market_regimes_regime_type ON public.market_regimes(regime_type);
CREATE INDEX IF NOT EXISTS idx_market_regimes_volatility ON public.market_regimes(volatility_regime);

-- Enable Row Level Security
ALTER TABLE public.market_regimes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow public read access to market_regimes"
    ON public.market_regimes FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow public insert to market_regimes"
    ON public.market_regimes FOR INSERT
    TO public
    WITH CHECK (true);

COMMENT ON TABLE public.market_regimes IS 'Tracks market conditions and regimes for context-aware predictions';
