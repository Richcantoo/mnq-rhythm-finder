-- Fix security warning: Function Search Path Mutable
-- Update the function to have immutable search_path

CREATE OR REPLACE FUNCTION public.update_chart_analysis_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.pattern_type, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.filename, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.price_direction, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.day_of_week, '')), 'D');
  RETURN NEW;
END;
$$;