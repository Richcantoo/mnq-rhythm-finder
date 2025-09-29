-- Fix RLS policies for chart_analyses table (no user_id column exists)
-- Drop the problematic policies that reference non-existent user_id column

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own chart analyses" ON public.chart_analyses;
DROP POLICY IF EXISTS "Users can insert their own chart analyses" ON public.chart_analyses;
DROP POLICY IF EXISTS "Users can update their own chart analyses" ON public.chart_analyses;
DROP POLICY IF EXISTS "Users can delete their own chart analyses" ON public.chart_analyses;

-- Create new policies that allow building a historical database
-- Since there's no user_id column, we make it accessible for analysis building
CREATE POLICY "Anyone can view chart analyses" 
ON public.chart_analyses 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create chart analyses" 
ON public.chart_analyses 
FOR INSERT 
WITH CHECK (true);

-- Restrict updates and deletes to admin users only (since no user ownership)
CREATE POLICY "No updates allowed" 
ON public.chart_analyses 
FOR UPDATE 
USING (false);

CREATE POLICY "No deletes allowed" 
ON public.chart_analyses 
FOR DELETE 
USING (false);