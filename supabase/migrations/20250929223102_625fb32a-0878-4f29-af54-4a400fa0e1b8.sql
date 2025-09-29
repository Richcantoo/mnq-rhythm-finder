-- Enable RLS on pattern_categories table and create appropriate policies
ALTER TABLE public.pattern_categories ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to view pattern categories (reference data)
CREATE POLICY "Anyone can view pattern categories" 
ON public.pattern_categories 
FOR SELECT 
USING (true);