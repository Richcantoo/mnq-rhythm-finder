import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

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
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Initialize Supabase client for fetching historical data
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('Analyzing current chart for prediction:', filename);

    // First, analyze the current chart
    const analysisResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'system',
            content: `You are an expert MNQ futures trading analyst. Analyze this current chart image to extract key temporal and pattern data for prediction analysis.

EXTRACT KEY FEATURES:
- Current chart date and day of week
- Current price levels and direction
- Volume patterns and momentum
- Key support/resistance levels
- Intraday session characteristics
- Current market sentiment (bullish/bearish/neutral)

RESPONSE FORMAT (JSON only):
{
  "current_analysis": {
    "chart_date": "YYYY-MM-DD",
    "day_of_week": "monday/tuesday/etc",
    "price_direction": "bullish/bearish/neutral",
    "momentum": "strong/moderate/weak",
    "volume_profile": "high/normal/low",
    "session_type": "pre-market/market-open/lunch/power-hour/after-hours",
    "key_levels": [{"type": "support/resistance", "price": 12345.67, "strength": 0.8}],
    "market_sentiment": "bullish/bearish/neutral",
    "volatility": "high/medium/low"
  }
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this current MNQ chart to extract key features for prediction. Focus on current price action, momentum, volume, and key levels. Return only valid JSON.`
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
        max_tokens: 1000,
        temperature: 0.1
      }),
    });

    if (!analysisResponse.ok) {
      throw new Error(`Analysis failed: ${analysisResponse.status}`);
    }

    const analysisData = await analysisResponse.json();
    let currentAnalysis;
    
    try {
      const aiResponse = analysisData.choices[0]?.message?.content;
      const cleanResponse = aiResponse.trim()
        .replace(/```json\s*/, '')
        .replace(/```\s*$/, '');
      
      const jsonStart = cleanResponse.indexOf('{');
      const jsonEnd = cleanResponse.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        currentAnalysis = JSON.parse(cleanResponse.substring(jsonStart, jsonEnd + 1));
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse current analysis:', parseError);
      currentAnalysis = {
        current_analysis: {
          chart_date: new Date().toISOString().split('T')[0],
          day_of_week: new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
          price_direction: "neutral",
          momentum: "moderate",
          volume_profile: "normal",
          session_type: "market-open",
          key_levels: [],
          market_sentiment: "neutral",
          volatility: "medium"
        }
      };
    }

    // Fetch historical chart analyses for pattern matching
    const { data: historicalData, error: dbError } = await supabase
      .from('chart_analyses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (dbError) {
      console.error('Database error:', dbError);
    }

    // Generate prediction based on current analysis and historical patterns
    const predictionResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'system',
            content: `You are an expert MNQ futures trading analyst specializing in pattern recognition and price prediction.

ANALYSIS TASK:
- Compare current chart analysis with historical pattern data
- Identify similar historical scenarios and their outcomes
- Generate specific price predictions with reasoning
- Provide confidence levels and risk assessment

PREDICTION CRITERIA:
- Day-of-week patterns (current vs historical same weekdays)
- Session timing patterns (pre-market, open, lunch, etc.)
- Similar price momentum and volume patterns
- Comparable market sentiment and volatility
- Support/resistance level interactions

RESPONSE FORMAT (JSON only):
{
  "prediction": {
    "price_direction": "bullish/bearish/neutral",
    "confidence_score": 0.75,
    "predicted_move": {
      "direction": "up/down/sideways",
      "magnitude": "small/medium/large",
      "target_levels": [12345.67, 12355.67],
      "timeframe": "15min/30min/1hour/2hour"
    },
    "similar_patterns": [
      {
        "date": "2025-09-26",
        "similarity_score": 0.85,
        "outcome": "bullish reversal +25 points",
        "reasoning": "Similar Friday afternoon momentum"
      }
    ],
    "risk_factors": ["high volatility", "key resistance nearby"],
    "trading_recommendation": {
      "action": "buy/sell/hold/wait",
      "entry_level": 12345.67,
      "stop_loss": 12335.67,
      "take_profit": 12365.67,
      "position_size": "small/medium/large"
    },
    "reasoning": "Detailed explanation of prediction logic"
  }
}`
          },
          {
            role: 'user',
            content: `CURRENT CHART ANALYSIS:
${JSON.stringify(currentAnalysis, null, 2)}

HISTORICAL PATTERNS (last 50 analyses):
${JSON.stringify(historicalData || [], null, 2)}

Based on the current chart analysis and historical pattern data, provide a detailed prediction of where the MNQ price is headed. Focus on similar historical scenarios and their outcomes to generate specific predictions with confidence levels.`
          }
        ],
        max_tokens: 2000,
        temperature: 0.2
      }),
    });

    if (!predictionResponse.ok) {
      throw new Error(`Prediction failed: ${predictionResponse.status}`);
    }

    const predictionData = await predictionResponse.json();
    let prediction;
    
    try {
      const aiResponse = predictionData.choices[0]?.message?.content;
      const cleanResponse = aiResponse.trim()
        .replace(/```json\s*/, '')
        .replace(/```\s*$/, '');
      
      const jsonStart = cleanResponse.indexOf('{');
      const jsonEnd = cleanResponse.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        prediction = JSON.parse(cleanResponse.substring(jsonStart, jsonEnd + 1));
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse prediction:', parseError);
      prediction = {
        prediction: {
          price_direction: "neutral",
          confidence_score: 0.5,
          predicted_move: {
            direction: "sideways",
            magnitude: "small",
            target_levels: [],
            timeframe: "1hour"
          },
          similar_patterns: [],
          risk_factors: ["insufficient historical data"],
          trading_recommendation: {
            action: "wait",
            entry_level: null,
            stop_loss: null,
            take_profit: null,
            position_size: "small"
          },
          reasoning: "Unable to generate reliable prediction due to insufficient data"
        }
      };
    }

    // Store current analysis in database for future reference
    if (currentAnalysis?.current_analysis) {
      const { error: insertError } = await supabase
        .from('chart_analyses')
        .insert({
          filename,
          chart_date: currentAnalysis.current_analysis.chart_date,
          day_of_week: currentAnalysis.current_analysis.day_of_week,
          pattern_type: currentAnalysis.current_analysis.market_sentiment,
          confidence_score: prediction?.prediction?.confidence_score || 0.5,
          price_direction: currentAnalysis.current_analysis.price_direction,
          key_levels: currentAnalysis.current_analysis.key_levels,
          pattern_features: {
            momentum: currentAnalysis.current_analysis.momentum,
            volume_profile: currentAnalysis.current_analysis.volume_profile,
            volatility: currentAnalysis.current_analysis.volatility
          },
          temporal_patterns: {
            session_type: currentAnalysis.current_analysis.session_type
          },
          session_details: {
            session_type: currentAnalysis.current_analysis.session_type
          },
          seasonal_context: {}
        });
      
      if (insertError) {
        console.error('Error storing analysis:', insertError);
      }
    }

    console.log('Prediction analysis complete for:', filename);

    return new Response(JSON.stringify({
      current_analysis: currentAnalysis?.current_analysis,
      prediction: prediction?.prediction,
      historical_patterns_count: historicalData?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in predict-chart function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: 'Failed to generate chart prediction'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});