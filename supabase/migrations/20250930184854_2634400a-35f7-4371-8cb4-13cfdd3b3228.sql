-- Add missing columns to prediction_feedback table
ALTER TABLE prediction_feedback 
ADD COLUMN IF NOT EXISTS was_correct boolean,
ADD COLUMN IF NOT EXISTS profit_loss_points numeric,
ADD COLUMN IF NOT EXISTS pattern_type text;

-- Create index for querying by pattern type
CREATE INDEX IF NOT EXISTS idx_prediction_feedback_pattern_type ON prediction_feedback(pattern_type);
CREATE INDEX IF NOT EXISTS idx_prediction_feedback_was_correct ON prediction_feedback(was_correct);