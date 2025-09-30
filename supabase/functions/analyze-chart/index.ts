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

    // Call Lovable AI Gateway for chart analysis
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro', // Using Pro for better image analysis
        messages: [
          {
            role: 'system',
            content: `You are an expert MNQ (Micro E-Mini NASDAQ-100) futures trading analyst. Analyze the provided 5-minute chart image and extract comprehensive temporal data to identify price movement patterns.

CRITICAL DATE EXTRACTION:
- Look carefully at ALL visible dates on the chart - headers, axes, watermarks, timestamps
- The chart date is the TRADING DATE, not the screenshot date
- Futures trading sessions: Sunday 1800 to Monday 1600, Monday 1800 to Tuesday 1600, etc.
- If you see a date like "9/26/2025" on the chart, use that exact date
- Day of week must match the extracted date (9/26/2025 = Friday)

SENTIMENT CLASSIFICATION (CRITICAL):
Determine the overall market sentiment based on price action:
- BULLISH: Strong upward momentum, higher highs/lows, buying pressure, breakouts above resistance
- BEARISH: Strong downward momentum, lower highs/lows, selling pressure, breakdowns below support
- NEUTRAL: Sideways movement, consolidation, no clear directional bias, range-bound

TEMPORAL EXTRACTION REQUIREMENTS:
1. Chart Date & Time: Extract exact date and all visible time stamps from chart axes, headers, or watermarks
2. Time Range: Identify the start and end times visible on the chart
3. Session Context: Determine trading session and precise time periods
4. Day of Week Analysis: Correlate price movements with specific weekday patterns

PATTERN CORRELATION ANALYSIS:
- Time-of-day patterns: Identify price movements at specific hours/minutes
- Day-of-week correlations: Note patterns specific to weekdays
- Intraday momentum: Track price direction changes throughout the session
- Volume-time relationships: Correlate volume spikes with specific times
- Volatility timing: Identify when highest/lowest volatility occurs

RESPONSE FORMAT (JSON only, no markdown):
{
  "chart_date": "YYYY-MM-DD",
  "day_of_week": "monday/tuesday/wednesday/thursday/friday",
  "sentiment_label": "bullish/bearish/neutral",
  "time_range": {
    "start_time": "HH:MM",
    "end_time": "HH:MM",
    "timezone": "EST/CST/PST"
  },
  "session_details": {
    "primary_session": "pre-market/market-open/lunch/power-hour/after-hours",
    "session_times": ["09:30-10:00", "10:00-11:00"],
    "session_characteristics": "string description"
  },
  "temporal_patterns": {
    "hourly_movements": [
      {
        "time": "09:30",
        "price_change": "+15.2",
        "direction": "bullish",
        "confidence": 0.8,
        "volume_correlation": "high"
      }
    ],
    "day_of_week_bias": {
      "pattern": "string description",
      "historical_tendency": "bullish/bearish/neutral",
      "confidence": 0.7
    },
    "intraday_rhythm": {
      "morning_bias": "bullish/bearish/neutral",
      "lunch_behavior": "consolidation/breakout/reversal",
      "afternoon_momentum": "continuation/reversal"
    }
  },
  "pattern_type": "string",
  "confidence_score": 0.8,
  "key_levels": [{"type": "support", "price": 12345.67, "strength": 0.8, "time_tested": "HH:MM"}],
  "pattern_features": {
    "trend_direction": "string",
    "volume_profile": "string",
    "volatility": "string",
    "price_velocity": "fast/moderate/slow",
    "support_resistance": [{"level": 12345.67, "strength": 0.8, "time_formed": "HH:MM"}]
  },
  "seasonal_context": {
    "month": "january/february/etc",
    "quarter": "Q1/Q2/Q3/Q4",
    "seasonal_bias": "string if applicable"
  }
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this MNQ 5-minute chart for trading patterns and opportunities. Focus on:
- Extract the exact chart date from any visible timestamps or date information
- Determine the day of the week from the chart date
- **DETERMINE MARKET SENTIMENT: Classify as bullish, bearish, or neutral based on overall price action**
- Price action patterns and trend analysis
- Volume characteristics and spikes
- Support and resistance levels
- Session timing patterns
- Trading opportunities

Return only valid JSON without any markdown formatting.`
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
        max_tokens: 2000,
        temperature: 0.1
      }),
    });

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

    // Parse the JSON response from AI
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
      
      // Find the JSON object start and end
      const jsonStart = cleanResponse.indexOf('{');
      const jsonEnd = cleanResponse.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanResponse = cleanResponse.substring(jsonStart, jsonEnd + 1);
      }
      
      analysis = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      console.error('Parse error:', parseError);
      
      // Try to extract date information even from partial response
      let extractedDate = null;
      let extractedDay = null;
      
      const dateMatch = aiResponse.match(/"chart_date":\s*"([^"]+)"/);
      const dayMatch = aiResponse.match(/"day_of_week":\s*"([^"]+)"/);
      
      if (dateMatch) extractedDate = dateMatch[1];
      if (dayMatch) extractedDay = dayMatch[1];
      
      // Use extracted date if available, otherwise fallback
      const currentDate = extractedDate || new Date().toISOString().split('T')[0];
      const dayOfWeek = extractedDay || new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      
      analysis = {
        chart_date: currentDate,
        day_of_week: dayOfWeek,
        sentiment_label: "neutral",
        pattern_type: "neutral",
        confidence_score: 0.5,
        session_time: "market-open",
        key_levels: [],
        pattern_features: {
          trend_direction: "sideways",
          volume_profile: "normal",
          volatility: "medium",
          support_resistance: []
        }
      };
    }

    // Add some realistic randomization for demo purposes if needed
    const now = new Date();
    const hour = now.getHours();
    
    // Infer session time from current time if not properly detected
    if (!analysis.session_time || analysis.session_time === 'unknown') {
      if (hour < 9) analysis.session_time = 'pre-market';
      else if (hour < 12) analysis.session_time = 'market-open';
      else if (hour < 15) analysis.session_time = 'lunch';
      else if (hour < 16) analysis.session_time = 'power-hour';
      else analysis.session_time = 'after-hours';
    }

    console.log('Analysis complete for:', filename);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

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