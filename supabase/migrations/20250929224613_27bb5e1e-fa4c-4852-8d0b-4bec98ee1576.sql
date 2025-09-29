-- Check and fix the chart_analyses policies properly
-- First drop ALL existing policies to clean slate

DO $$
BEGIN
    DROP POLICY IF EXISTS "Anyone can view chart analyses" ON public.chart_analyses;
    DROP POLICY IF EXISTS "Anyone can create chart analyses" ON public.chart_analyses;
    DROP POLICY IF EXISTS "Users can view their own chart analyses" ON public.chart_analyses;
    DROP POLICY IF EXISTS "Users can insert their own chart analyses" ON public.chart_analyses;
    DROP POLICY IF EXISTS "Users can update their own chart analyses" ON public.chart_analyses;
    DROP POLICY IF EXISTS "Users can delete their own chart analyses" ON public.chart_analyses;
    DROP POLICY IF EXISTS "Users can create their own chart analyses" ON public.chart_analyses;
    DROP POLICY IF EXISTS "No updates allowed" ON public.chart_analyses;
    DROP POLICY IF EXISTS "No deletes allowed" ON public.chart_analyses;
EXCEPTION 
    WHEN undefined_object THEN NULL;
END $$;

-- Create simple policies for building historical database
CREATE POLICY "Allow all reads" 
ON public.chart_analyses 
FOR SELECT 
USING (true);

CREATE POLICY "Allow all inserts" 
ON public.chart_analyses 
FOR INSERT 
WITH CHECK (true);