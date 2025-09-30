import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import {
  calculateRSI,
  calculateATR,
  calculateMACD,
  calculateVolumeVsAverage,
  calculateDistanceFromVWAP,
  determineMarketRegime
} from '../_shared/technical-indicators.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('Enhanced analysis for:', filename);

    // Multi-timeframe analysis - analyze the same chart for different timeframe perspectives
    const timeframes = ['5min', '15min', '60min'];
    const timeframeAnalyses: any = {};

    for (const tf of timeframes) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `You are an expert trading analyst. Analyze this ${tf} chart for MNQ futures.

EXTRACT (JSON only, no markdown):
{
  "chart_date": "YYYY-MM-DD",
  "day_of_week": "monday/tuesday/wednesday/thursday/friday",
  "sentiment_label": "bullish/bearish/neutral",
  "price_direction": "bullish/bearish/neutral",
  "momentum": "strong/moderate/weak",
  "volatility": "high/medium/low",
  "volume_profile": "high/normal/low",
  "session_type": "pre-market/market-open/lunch/power-hour/after-hours",
  "pattern_type": "breakout/breakdown/reversal/continuation/consolidation",
  "confidence_score": 0.85,
  "key_levels": [{"type": "support/resistance", "price": 16000.00, "strength": 0.9}],
  "support_levels": [{"price": 15950.00, "strength": 0.8, "touches": 3}],
  "resistance_levels": [{"price": 16050.00, "strength": 0.9, "touches": 2}],
  "price_range": {"high": 16100, "low": 15900, "current": 16000}
}

Focus on ${tf} timeframe perspective. Look for:
- Support/resistance zones (not just lines)
- Order blocks (institutional footprints)
- Liquidity pools (where stops cluster)
- Market structure (higher highs/lows or lower highs/lows)`
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: `Analyze this MNQ chart from a ${tf} perspective. Return only JSON.`
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
          console.error(`${tf} analysis failed:`, response.status);
          continue;
        }

        const data = await response.json();
        const aiResponse = data.choices[0]?.message?.content;

        if (!aiResponse) {
          console.error(`No response for ${tf}`);
          continue;
        }

        // Parse JSON response
        let analysis;
        try {
          let cleanResponse = aiResponse.trim();
          
          if (cleanResponse.startsWith('```json')) {
            cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
          }
          if (cleanResponse.startsWith('```')) {
            cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '');
          }
          
          const jsonStart = cleanResponse.indexOf('{');
          const jsonEnd = cleanResponse.lastIndexOf('}');
          
          if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            cleanResponse = cleanResponse.substring(jsonStart, jsonEnd + 1);
          }
          
          analysis = JSON.parse(cleanResponse);
        } catch (parseError) {
          console.error(`Parse error for ${tf}:`, parseError);
          
          // Fallback extraction
          const extractField = (pattern: RegExp) => {
            const match = aiResponse.match(pattern);
            return match ? match[1] : null;
          };
          
          analysis = {
            chart_date: extractField(/"chart_date":\s*"([^"]+)"/) || new Date().toISOString().split('T')[0],
            day_of_week: extractField(/"day_of_week":\s*"([^"]+)"/) || 'unknown',
            sentiment_label: extractField(/"sentiment_label":\s*"([^"]+)"/) || 'neutral',
            price_direction: extractField(/"price_direction":\s*"([^"]+)"/) || 'neutral',
            momentum: extractField(/"momentum":\s*"([^"]+)"/) || 'moderate',
            volatility: extractField(/"volatility":\s*"([^"]+)"/) || 'medium',
            volume_profile: extractField(/"volume_profile":\s*"([^"]+)"/) || 'normal',
            session_type: 'market-open',
            pattern_type: 'consolidation',
            confidence_score: 0.6,
            key_levels: [],
            support_levels: [],
            resistance_levels: []
          };
        }

        timeframeAnalyses[tf] = analysis;
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (fetchError) {
        clearTimeout(timeoutId);
        console.error(`Error analyzing ${tf}:`, fetchError);
      }
    }

    // Use 5min as primary analysis
    const primaryAnalysis = timeframeAnalyses['5min'] || timeframeAnalyses['15min'] || timeframeAnalyses['60min'];
    
    if (!primaryAnalysis) {
      throw new Error('No successful timeframe analysis');
    }

    // Calculate technical indicators
    const rsi = calculateRSI(
      primaryAnalysis.price_direction,
      primaryAnalysis.momentum,
      primaryAnalysis.volatility
    );

    const currentPrice = primaryAnalysis.price_range?.current || 16000;
    const atr = calculateATR(primaryAnalysis.volatility, currentPrice);

    const macd = calculateMACD(
      primaryAnalysis.price_direction,
      primaryAnalysis.momentum
    );

    const volumeVsAvg = calculateVolumeVsAverage(primaryAnalysis.volume_profile);
    const distanceFromVWAP = calculateDistanceFromVWAP(primaryAnalysis.price_direction);

    // Determine market regime
    const marketRegime = determineMarketRegime(
      primaryAnalysis.price_direction,
      primaryAnalysis.momentum,
      primaryAnalysis.volatility,
      rsi
    );

    // Analyze timeframe alignment
    const timeframeAlignment = {
      tf_5min: timeframeAnalyses['5min']?.sentiment_label || 'neutral',
      tf_15min: timeframeAnalyses['15min']?.sentiment_label || 'neutral',
      tf_60min: timeframeAnalyses['60min']?.sentiment_label || 'neutral',
      alignment_score: 0,
      all_aligned: false
    };

    // Calculate alignment score
    const sentiments = [
      timeframeAlignment.tf_5min,
      timeframeAlignment.tf_15min,
      timeframeAlignment.tf_60min
    ];
    
    const allBullish = sentiments.every(s => s === 'bullish');
    const allBearish = sentiments.every(s => s === 'bearish');
    timeframeAlignment.all_aligned = allBullish || allBearish;
    
    if (timeframeAlignment.tf_5min === timeframeAlignment.tf_15min) timeframeAlignment.alignment_score += 0.33;
    if (timeframeAlignment.tf_15min === timeframeAlignment.tf_60min) timeframeAlignment.alignment_score += 0.33;
    if (timeframeAlignment.tf_5min === timeframeAlignment.tf_60min) timeframeAlignment.alignment_score += 0.34;

    // Store enhanced analysis in database
    const { data: insertedData, error: insertError } = await supabase
      .from('chart_analyses')
      .insert({
        filename,
        chart_date: primaryAnalysis.chart_date,
        day_of_week: primaryAnalysis.day_of_week,
        pattern_type: primaryAnalysis.pattern_type,
        confidence_score: primaryAnalysis.confidence_score,
        sentiment_label: primaryAnalysis.sentiment_label,
        price_direction: primaryAnalysis.price_direction,
        key_levels: primaryAnalysis.key_levels,
        pattern_features: {
          trend_direction: primaryAnalysis.price_direction,
          volume_profile: primaryAnalysis.volume_profile,
          volatility: primaryAnalysis.volatility,
          momentum: primaryAnalysis.momentum,
          support_resistance: primaryAnalysis.key_levels
        },
        temporal_patterns: {
          session_type: primaryAnalysis.session_type
        },
        session_details: {
          session_type: primaryAnalysis.session_type
        },
        seasonal_context: {},
        // New technical indicator fields
        rsi_value: rsi,
        atr_value: atr,
        macd_value: macd.value,
        macd_signal: macd.signal,
        macd_histogram: macd.histogram,
        volume_vs_average: volumeVsAvg,
        distance_from_vwap: distanceFromVWAP,
        market_regime: marketRegime.regime,
        volatility_regime: marketRegime.volatility,
        volume_regime: marketRegime.volume,
        timeframe_alignment: timeframeAlignment,
        support_levels: primaryAnalysis.support_levels,
        resistance_levels: primaryAnalysis.resistance_levels
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error storing enhanced analysis:', insertError);
    } else {
      console.log('Successfully stored enhanced analysis with technical indicators');
    }

    // Return comprehensive analysis
    return new Response(JSON.stringify({
      ...primaryAnalysis,
      technical_indicators: {
        rsi,
        atr,
        macd,
        volume_vs_average: volumeVsAvg,
        distance_from_vwap: distanceFromVWAP
      },
      market_regime: marketRegime,
      timeframe_alignment: timeframeAlignment,
      timeframe_analyses: timeframeAnalyses
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-chart-enhanced:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: 'Failed to perform enhanced chart analysis'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
