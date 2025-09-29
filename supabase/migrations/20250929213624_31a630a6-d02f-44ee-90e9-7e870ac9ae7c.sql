-- Create storage bucket for chart images
INSERT INTO storage.buckets (id, name, public) VALUES ('chart-images', 'chart-images', true);

-- Create table for chart images
CREATE TABLE public.chart_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Chart analysis metadata
  trade_date DATE,
  session_time TEXT, -- 'pre-market', 'market-open', 'lunch', 'power-hour', 'after-hours'
  season TEXT, -- 'spring', 'summer', 'fall', 'winter'
  pattern_type TEXT, -- 'bullish', 'bearish', 'neutral', 'reversal', 'continuation'
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  
  -- AI analysis results
  ai_analysis JSONB,
  key_levels JSONB, -- support/resistance levels
  pattern_features JSONB, -- shape characteristics, volumes, etc.
  
  -- Similar patterns
  similar_images UUID[], -- array of similar chart image ids
  similarity_scores DECIMAL(3,2)[], -- corresponding similarity scores
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.chart_images ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own chart images" 
ON public.chart_images 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can upload their own chart images" 
ON public.chart_images 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chart images" 
ON public.chart_images 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chart images" 
ON public.chart_images 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create table for pattern categories
CREATE TABLE public.pattern_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color_hex TEXT NOT NULL DEFAULT '#3B82F6',
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default pattern categories
INSERT INTO public.pattern_categories (name, description, color_hex, icon) VALUES
('Bullish Breakout', 'Upward price breakouts above resistance', '#10B981', 'TrendingUp'),
('Bearish Breakdown', 'Downward price breakdowns below support', '#EF4444', 'TrendingDown'),
('Reversal Pattern', 'Price patterns indicating trend reversal', '#F59E0B', 'RotateCcw'),
('Continuation', 'Patterns confirming trend continuation', '#8B5CF6', 'ArrowRight'),
('Consolidation', 'Sideways price action and range-bound trading', '#6B7280', 'Minus'),
('High Volume Spike', 'Unusual volume activity patterns', '#EC4899', 'BarChart3');

-- Create indexes for better performance
CREATE INDEX idx_chart_images_user_id ON public.chart_images(user_id);
CREATE INDEX idx_chart_images_trade_date ON public.chart_images(trade_date);
CREATE INDEX idx_chart_images_pattern_type ON public.chart_images(pattern_type);
CREATE INDEX idx_chart_images_session_time ON public.chart_images(session_time);
CREATE INDEX idx_chart_images_confidence_score ON public.chart_images(confidence_score DESC);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_chart_images_updated_at
BEFORE UPDATE ON public.chart_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage policies for chart images
CREATE POLICY "Chart images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'chart-images');

CREATE POLICY "Users can upload their own chart images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'chart-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own chart images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'chart-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own chart images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'chart-images' AND auth.uid()::text = (storage.foldername(name))[1]);