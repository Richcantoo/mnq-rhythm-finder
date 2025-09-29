-- Phase 3: Data Management - User Notes, Tags, and Enhanced Search

-- Create table for user-defined tags
CREATE TABLE public.pattern_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color_hex TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction table for chart analysis tags
CREATE TABLE public.chart_analysis_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chart_analysis_id UUID REFERENCES public.chart_analyses(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.pattern_tags(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure a chart can't have the same tag twice
  UNIQUE(chart_analysis_id, tag_id)
);

-- Create table for user notes on patterns
CREATE TABLE public.pattern_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chart_analysis_id UUID REFERENCES public.chart_analyses(id) ON DELETE CASCADE,
  note_title TEXT,
  note_content TEXT NOT NULL,
  note_type TEXT DEFAULT 'general', -- 'general', 'strategy', 'observation', 'warning'
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for saved searches and filters
CREATE TABLE public.saved_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  search_name TEXT NOT NULL,
  search_description TEXT,
  search_criteria JSONB NOT NULL, -- stores filter criteria
  is_favorite BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for export jobs and history
CREATE TABLE public.export_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  export_type TEXT NOT NULL, -- 'csv', 'json', 'pdf'
  export_criteria JSONB NOT NULL, -- filter criteria used
  file_path TEXT, -- path to generated file
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  record_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Add full-text search capability to chart analyses
ALTER TABLE public.chart_analyses 
ADD COLUMN search_vector tsvector;

-- Create function to update search vector
CREATE OR REPLACE FUNCTION public.update_chart_analysis_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.pattern_type, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.filename, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.price_direction, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.day_of_week, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic search vector updates
CREATE TRIGGER update_chart_analysis_search_vector_trigger
  BEFORE INSERT OR UPDATE ON public.chart_analyses
  FOR EACH ROW EXECUTE FUNCTION public.update_chart_analysis_search_vector();

-- Update existing records with search vectors
UPDATE public.chart_analyses SET 
  search_vector = 
    setweight(to_tsvector('english', COALESCE(pattern_type, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(filename, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(price_direction, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(day_of_week, '')), 'D');

-- Enable Row Level Security
ALTER TABLE public.pattern_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chart_analysis_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pattern_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pattern_tags
CREATE POLICY "Allow all reads for pattern tags" 
ON public.pattern_tags 
FOR SELECT 
USING (true);

CREATE POLICY "Allow all inserts for pattern tags" 
ON public.pattern_tags 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow all updates for pattern tags" 
ON public.pattern_tags 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow all deletes for pattern tags" 
ON public.pattern_tags 
FOR DELETE 
USING (true);

-- RLS Policies for chart_analysis_tags
CREATE POLICY "Allow all reads for chart analysis tags" 
ON public.chart_analysis_tags 
FOR SELECT 
USING (true);

CREATE POLICY "Allow all inserts for chart analysis tags" 
ON public.chart_analysis_tags 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow all deletes for chart analysis tags" 
ON public.chart_analysis_tags 
FOR DELETE 
USING (true);

-- RLS Policies for pattern_notes
CREATE POLICY "Allow all reads for pattern notes" 
ON public.pattern_notes 
FOR SELECT 
USING (true);

CREATE POLICY "Allow all inserts for pattern notes" 
ON public.pattern_notes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow all updates for pattern notes" 
ON public.pattern_notes 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow all deletes for pattern notes" 
ON public.pattern_notes 
FOR DELETE 
USING (true);

-- RLS Policies for saved_searches
CREATE POLICY "Allow all reads for saved searches" 
ON public.saved_searches 
FOR SELECT 
USING (true);

CREATE POLICY "Allow all inserts for saved searches" 
ON public.saved_searches 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow all updates for saved searches" 
ON public.saved_searches 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow all deletes for saved searches" 
ON public.saved_searches 
FOR DELETE 
USING (true);

-- RLS Policies for export_jobs
CREATE POLICY "Allow all reads for export jobs" 
ON public.export_jobs 
FOR SELECT 
USING (true);

CREATE POLICY "Allow all inserts for export jobs" 
ON public.export_jobs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow all updates for export jobs" 
ON public.export_jobs 
FOR UPDATE 
USING (true);

-- Create indexes for performance
CREATE INDEX idx_chart_analysis_tags_chart ON public.chart_analysis_tags(chart_analysis_id);
CREATE INDEX idx_chart_analysis_tags_tag ON public.chart_analysis_tags(tag_id);
CREATE INDEX idx_pattern_notes_chart ON public.pattern_notes(chart_analysis_id);
CREATE INDEX idx_pattern_notes_type ON public.pattern_notes(note_type);
CREATE INDEX idx_saved_searches_favorite ON public.saved_searches(is_favorite);
CREATE INDEX idx_export_jobs_status ON public.export_jobs(status);
CREATE INDEX idx_export_jobs_created ON public.export_jobs(created_at);

-- Full-text search index
CREATE INDEX idx_chart_analyses_search_vector ON public.chart_analyses USING GIN(search_vector);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_pattern_tags_updated_at
BEFORE UPDATE ON public.pattern_tags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pattern_notes_updated_at
BEFORE UPDATE ON public.pattern_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saved_searches_updated_at
BEFORE UPDATE ON public.saved_searches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default tags
INSERT INTO public.pattern_tags (name, description, color_hex) VALUES
('High Probability', 'Patterns with strong success rate', '#22C55E'),
('Breakout', 'Clear breakout patterns', '#3B82F6'),
('Reversal', 'Market reversal patterns', '#EF4444'),
('Continuation', 'Trend continuation patterns', '#F59E0B'),
('Volume Spike', 'Patterns with unusual volume', '#8B5CF6'),
('News Event', 'Patterns around news events', '#06B6D4'),
('Session Open', 'Patterns at session opening', '#EC4899'),
('Key Level', 'Patterns at important price levels', '#10B981');