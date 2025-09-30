-- Create pattern_performance table for tracking which patterns actually work
CREATE TABLE IF NOT EXISTS public.pattern_performance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Pattern identification
    pattern_type TEXT NOT NULL,
    pattern_signature TEXT, -- Hash or unique identifier for specific pattern
    
    -- Performance metrics
    total_occurrences INTEGER DEFAULT 0,
    successful_predictions INTEGER DEFAULT 0,
    failed_predictions INTEGER DEFAULT 0,
    win_rate FLOAT,
    average_profit_points FLOAT,
    average_loss_points FLOAT,
    profit_factor FLOAT,
    
    -- Context where pattern works best
    best_day_of_week TEXT,
    best_session_type TEXT,
    best_market_regime TEXT,
    best_volatility_regime TEXT,
    
    -- Conditions
    conditions JSONB,
    
    -- Statistical confidence
    sample_size INTEGER,
    confidence_level FLOAT,
    
    -- Last updated
    last_occurrence_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pattern_performance_pattern_type ON public.pattern_performance(pattern_type);
CREATE INDEX IF NOT EXISTS idx_pattern_performance_win_rate ON public.pattern_performance(win_rate);
CREATE INDEX IF NOT EXISTS idx_pattern_performance_total_occurrences ON public.pattern_performance(total_occurrences);

-- Enable Row Level Security
ALTER TABLE public.pattern_performance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow public read access to pattern_performance"
    ON public.pattern_performance FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow public insert to pattern_performance"
    ON public.pattern_performance FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Allow public update to pattern_performance"
    ON public.pattern_performance FOR UPDATE
    TO public
    USING (true);

COMMENT ON TABLE public.pattern_performance IS 'Tracks which patterns have high success rates vs which dont work';
