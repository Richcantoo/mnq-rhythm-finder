import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, filename } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Analyzing chart image:', filename);

    // Call Lovable AI Gateway with timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash', // Using flash for faster, reliable responses
          messages: [
            {
              role: 'system',
              content: `You are an expert trading chart analyst. Analyze the chart image and return ONLY valid JSON (no markdown, no code blocks).

CRITICAL: Focus on market sentiment based on price action:
- BULLISH: Upward momentum, higher highs/lows, buying pressure
- BEARISH: Downward momentum, lower highs/lows, selling pressure  
- NEUTRAL: Sideways, consolidation, range-bound

Extract date/time from chart. Return this exact JSON structure:
{
  "chart_date": "YYYY-MM-DD",
  "day_of_week": "monday/tuesday/wednesday/thursday/friday",
  "sentiment_label": "bullish/bearish/neutral",
  "pattern_type": "string",
  "confidence_score": 0.85,
  "time_range": {"start": "HH:MM", "end": "HH:MM"},
  "key_levels": [{"type": "support/resistance", "price": 12345.67}],
  "pattern_features": {"trend": "string", "volume": "string", "volatility": "string"}
}`
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze this chart. Extract date, determine day of week, classify sentiment (bullish/bearish/neutral), identify patterns. Return only JSON.`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/png;base64,${image}`
                  }
                }
              ]
            }
          ],
          max_tokens: 1500
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI Gateway error:', response.status, errorText);
        
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
            { 
              status: 429,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
        
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: 'AI credits exhausted. Please add more credits.' }),
            { 
              status: 402,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
        
        throw new Error(`AI Gateway error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content;

      if (!aiResponse) {
        throw new Error('No response from AI model');
      }

      console.log('AI Response length:', aiResponse.length);
      console.log('AI Response preview:', aiResponse.substring(0, 200));

      // Parse the JSON response from AI with improved error handling
      let analysis;
      try {
        // Clean the response to remove any markdown formatting
        let cleanResponse = aiResponse.trim();
        
        // Remove markdown code blocks
        if (cleanResponse.startsWith('```json')) {
          cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
        }
        if (cleanResponse.startsWith('```')) {
          cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '');
        }
        
        // Find the JSON object boundaries
        const jsonStart = cleanResponse.indexOf('{');
        const jsonEnd = cleanResponse.lastIndexOf('}');
        
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          cleanResponse = cleanResponse.substring(jsonStart, jsonEnd + 1);
        }
        
        // Attempt to fix common truncation issues
        // If response ends with incomplete string, try to close it
        if (cleanResponse.match(/:\s*"[^"]*$/)) {
          cleanResponse = cleanResponse + '"}';
        }
        
        console.log('Cleaned response:', cleanResponse);
        analysis = JSON.parse(cleanResponse);
        
        // Validate required fields
        if (!analysis.sentiment_label) {
          throw new Error('Missing sentiment_label in response');
        }
        
        console.log('Successfully parsed analysis. Sentiment:', analysis.sentiment_label);
        
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Failed response:', aiResponse);
        
        // Enhanced partial extraction - prioritize sentiment
        const extractField = (pattern: RegExp) => {
          const match = aiResponse.match(pattern);
          return match ? match[1] : null;
        };
        
        const extractedDate = extractField(/"chart_date":\s*"([^"]+)"/);
        const extractedDay = extractField(/"day_of_week":\s*"([^"]+)"/);
        const extractedSentiment = extractField(/"sentiment_label":\s*"([^"]+)"/);
        const extractedPattern = extractField(/"pattern_type":\s*"([^"]+)"/);
        const extractedConfidence = extractField(/"confidence_score":\s*([\d.]+)/);
        
        console.log('Extracted fields:', {
          date: extractedDate,
          day: extractedDay,
          sentiment: extractedSentiment,
          pattern: extractedPattern,
          confidence: extractedConfidence
        });
        
        // Build analysis from extracted fields with better defaults
        const currentDate = extractedDate || new Date().toISOString().split('T')[0];
        const dayOfWeek = extractedDay || new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        
        analysis = {
          chart_date: currentDate,
          day_of_week: dayOfWeek,
          sentiment_label: extractedSentiment || "neutral",
          pattern_type: extractedPattern || "consolidation",
          confidence_score: extractedConfidence ? parseFloat(extractedConfidence) : 0.6,
          session_time: "market-open",
          key_levels: [],
          pattern_features: {
            trend_direction: extractedSentiment === "bullish" ? "upward" : extractedSentiment === "bearish" ? "downward" : "sideways",
            volume_profile: "normal",
            volatility: "medium",
            support_resistance: []
          }
        };
        
        console.log('Using partial extraction fallback:', analysis);
      }

      // Infer session time if not present
      const now = new Date();
      const hour = now.getHours();
      
      if (!analysis.session_time || analysis.session_time === 'unknown') {
        if (hour < 9) analysis.session_time = 'pre-market';
        else if (hour < 12) analysis.session_time = 'market-open';
        else if (hour < 15) analysis.session_time = 'lunch';
        else if (hour < 16) analysis.session_time = 'power-hour';
        else analysis.session_time = 'after-hours';
      }

      console.log('Analysis complete for:', filename, '- Sentiment:', analysis.sentiment_label);

      return new Response(JSON.stringify(analysis), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('AI request timed out');
        return new Response(
          JSON.stringify({ error: 'AI analysis timed out. Please try again.' }),
          { 
            status: 504,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      throw fetchError;
    }

  } catch (error) {
    console.error('Error in analyze-chart function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: 'Failed to analyze chart image'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});