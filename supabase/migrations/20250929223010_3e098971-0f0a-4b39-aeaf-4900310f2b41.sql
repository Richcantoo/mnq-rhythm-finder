-- Create table to store analyzed chart data for historical pattern matching
CREATE TABLE public.chart_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  chart_date DATE NOT NULL,
  day_of_week TEXT NOT NULL,
  pattern_type TEXT NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL,
  price_direction TEXT,
  key_levels JSONB,
  pattern_features JSONB,
  temporal_patterns JSONB,
  session_details JSONB,
  seasonal_context JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.chart_analyses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (since this is a demo app)
CREATE POLICY "Anyone can view chart analyses" 
ON public.chart_analyses 
FOR SELECT 
USING (true);

-- Create policy to allow public insert access
CREATE POLICY "Anyone can insert chart analyses" 
ON public.chart_analyses 
FOR INSERT 
WITH CHECK (true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_chart_analyses_updated_at
BEFORE UPDATE ON public.chart_analyses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance on date queries
CREATE INDEX idx_chart_analyses_date ON public.chart_analyses(chart_date);
CREATE INDEX idx_chart_analyses_day_of_week ON public.chart_analyses(day_of_week);
CREATE INDEX idx_chart_analyses_pattern_type ON public.chart_analyses(pattern_type);