-- Create prediction_feedback table for tracking prediction accuracy
CREATE TABLE IF NOT EXISTS public.prediction_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Link to original prediction
    prediction_outcome_id UUID REFERENCES public.prediction_outcomes(id) ON DELETE CASCADE,
    chart_analysis_id UUID REFERENCES public.chart_analyses(id) ON DELETE CASCADE,
    
    -- Prediction details
    predicted_direction TEXT NOT NULL CHECK (predicted_direction IN ('bullish', 'bearish', 'neutral')),
    predicted_price_target FLOAT,
    predicted_timeframe_minutes INTEGER,
    confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    -- Actual outcome
    actual_direction TEXT CHECK (actual_direction IN ('bullish', 'bearish', 'neutral')),
    actual_price_move FLOAT,
    actual_high FLOAT,
    actual_low FLOAT,
    outcome_measured_at TIMESTAMP WITH TIME ZONE,
    
    -- Performance metrics
    was_correct BOOLEAN,
    accuracy_score FLOAT,
    profit_loss_points FLOAT,
    
    -- Conditions at time of prediction
    conditions JSONB,
    
    -- Pattern performance tracking
    pattern_type TEXT,
    similar_patterns_used INTEGER,
    ensemble_agreement_score FLOAT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_prediction_feedback_was_correct ON public.prediction_feedback(was_correct);
CREATE INDEX IF NOT EXISTS idx_prediction_feedback_pattern_type ON public.prediction_feedback(pattern_type);
CREATE INDEX IF NOT EXISTS idx_prediction_feedback_predicted_direction ON public.prediction_feedback(predicted_direction);
CREATE INDEX IF NOT EXISTS idx_prediction_feedback_created_at ON public.prediction_feedback(created_at);

-- Enable Row Level Security
ALTER TABLE public.prediction_feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow public read access to prediction_feedback"
    ON public.prediction_feedback FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow public insert to prediction_feedback"
    ON public.prediction_feedback FOR INSERT
    TO public
    WITH CHECK (true);

COMMENT ON TABLE public.prediction_feedback IS 'Tracks prediction accuracy and outcomes for continuous improvement';
