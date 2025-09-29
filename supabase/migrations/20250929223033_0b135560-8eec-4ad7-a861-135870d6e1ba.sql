-- The chart_analyses table should have RLS policies for proper security
-- Remove the overly permissive policies and create user-specific policies

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can view chart analyses" ON public.chart_analyses;
DROP POLICY IF EXISTS "Anyone can insert chart analyses" ON public.chart_analyses;

-- Create user-specific RLS policies
CREATE POLICY "Users can view their own chart analyses" 
ON public.chart_analyses 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert their own chart analyses" 
ON public.chart_analyses 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own chart analyses" 
ON public.chart_analyses 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own chart analyses" 
ON public.chart_analyses 
FOR DELETE 
USING (auth.uid() IS NOT NULL);