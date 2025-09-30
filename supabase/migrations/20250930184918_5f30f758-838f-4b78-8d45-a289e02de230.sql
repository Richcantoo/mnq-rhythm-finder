-- Add all missing columns to prediction_feedback table
ALTER TABLE prediction_feedback 
ADD COLUMN IF NOT EXISTS predicted_price_target numeric,
ADD COLUMN IF NOT EXISTS predicted_timeframe_minutes integer,
ADD COLUMN IF NOT EXISTS actual_price_move numeric,
ADD COLUMN IF NOT EXISTS outcome_measured_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS accuracy_score numeric;