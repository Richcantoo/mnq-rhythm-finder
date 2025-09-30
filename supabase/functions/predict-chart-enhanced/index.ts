import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import {
  calculateRSI,
  calculateATR,
  calculateMACD,
  calculateVolumeVsAverage,
  calculateDistanceFromVWAP,
  determineMarketRegime,
  calculateSimilarityScore
} from '../_shared/technical-indicators.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnsemblePrediction {
  method: string;
  direction: string;
  confidence: number;
  reasoning: string;
}

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
    console.log('Enhanced prediction for:', filename);

    // Step 1: Analyze current chart
    const controller1 = new AbortController();
    const timeoutId1 = setTimeout(() => controller1.abort(), 30000);

    let analysisResponse;
    try {
      analysisResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        signal: controller1.signal,
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `Analyze this MNQ chart comprehensively. Return JSON only:
{
  "chart_date": "YYYY-MM-DD",
  "day_of_week": "monday/tuesday/etc",
  "sentiment_label": "bullish/bearish/neutral",
  "price_direction": "bullish/bearish/neutral",
  "momentum": "strong/moderate/weak",
  "volatility": "high/medium/low",
  "volume_profile": "high/normal/low",
  "session_type": "pre-market/market-open/lunch/power-hour/after-hours",
  "key_levels": [{"type": "support/resistance", "price": 16000, "strength": 0.9}],
  "support_levels": [{"price": 15950, "strength": 0.8}],
  "resistance_levels": [{"price": 16050, "strength": 0.9}],
  "price_range": {"high": 16100, "low": 15900, "current": 16000},
  "near_support": true,
  "near_resistance": false
}`
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Analyze current MNQ chart. JSON only.' },
                { type: 'image_url', image_url: { url: `data:image/png;base64,${image}` }}
              ]
            }
          ],
          max_tokens: 1000
        }),
      });
    } catch (fetchError) {
      clearTimeout(timeoutId1);
      throw fetchError;
    }

    clearTimeout(timeoutId1);

    if (!analysisResponse.ok) {
      throw new Error(`Analysis failed: ${analysisResponse.status}`);
    }

    const analysisData = await analysisResponse.json();
    const aiResponse = analysisData.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No analysis response');
    }

    // Parse current analysis
    let currentAnalysis: any;
    try {
      let cleanResponse = aiResponse.trim()
        .replace(/```json\s*/, '').replace(/```\s*$/, '')
        .replace(/```\s*/, '').replace(/```\s*$/, '');
      
      const jsonStart = cleanResponse.indexOf('{');
      const jsonEnd = cleanResponse.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        cleanResponse = cleanResponse.substring(jsonStart, jsonEnd + 1);
      }
      
      currentAnalysis = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('Parse error, using fallback');
      currentAnalysis = {
        chart_date: new Date().toISOString().split('T')[0],
        day_of_week: new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
        sentiment_label: 'neutral',
        price_direction: 'neutral',
        momentum: 'moderate',
        volatility: 'medium',
        volume_profile: 'normal',
        session_type: 'market-open',
        key_levels: [],
        support_levels: [],
        resistance_levels: [],
        price_range: { current: 16000 }
      };
    }

    // Calculate technical indicators for current chart
    const rsi = calculateRSI(currentAnalysis.price_direction, currentAnalysis.momentum, currentAnalysis.volatility);
    const atr = calculateATR(currentAnalysis.volatility, currentAnalysis.price_range?.current || 16000);
    const macd = calculateMACD(currentAnalysis.price_direction, currentAnalysis.momentum);
    const volumeVsAvg = calculateVolumeVsAverage(currentAnalysis.volume_profile);
    const marketRegime = determineMarketRegime(currentAnalysis.price_direction, currentAnalysis.momentum, currentAnalysis.volatility, rsi);

    // Step 2: Fetch historical patterns with advanced filtering
    const { data: historicalData, error: dbError } = await supabase
      .from('chart_analyses')
      .select('*')
      .not('actual_outcome', 'is', null) // Only patterns with known outcomes
      .gte('confidence_score', 0.65) // Minimum confidence threshold
      .order('created_at', { ascending: false })
      .limit(500); // Increased from 50 to 500

    if (dbError) {
      console.error('Database error:', dbError);
    }

    // Step 3: Calculate similarity scores for all historical patterns
    const scoredPatterns = (historicalData || []).map(historical => ({
      ...historical,
      similarity_score: calculateSimilarityScore(
        {
          ...currentAnalysis,
          rsi_value: rsi,
          volatility_regime: marketRegime.volatility,
          volume_regime: marketRegime.volume
        },
        historical
      )
    }))
    .filter(p => p.similarity_score >= 0.60) // Only keep similar patterns (60%+ match)
    .sort((a, b) => b.similarity_score - a.similarity_score)
    .slice(0, 20); // Top 20 most similar

    console.log(`Found ${scoredPatterns.length} similar patterns out of ${historicalData?.length || 0} historical analyses`);

    // Step 4: Pattern-based prediction
    const patternPrediction: EnsemblePrediction = {
      method: 'pattern_matching',
      direction: 'neutral',
      confidence: 0,
      reasoning: 'Insufficient similar patterns'
    };

    if (scoredPatterns.length >= 5) {
      const bullishCount = scoredPatterns.filter(p => 
        (p.actual_outcome === 'bullish' || p.price_direction === 'bullish')).length;
      const bearishCount = scoredPatterns.filter(p => 
        (p.actual_outcome === 'bearish' || p.price_direction === 'bearish')).length;
      
      const totalCount = bullishCount + bearishCount;
      const bullishRate = bullishCount / totalCount;
      const bearishRate = bearishCount / totalCount;

      if (bullishRate > 0.65) {
        patternPrediction.direction = 'bullish';
        patternPrediction.confidence = bullishRate;
        patternPrediction.reasoning = `${bullishCount}/${totalCount} similar patterns were bullish`;
      } else if (bearishRate > 0.65) {
        patternPrediction.direction = 'bearish';
        patternPrediction.confidence = bearishRate;
        patternPrediction.reasoning = `${bearishCount}/${totalCount} similar patterns were bearish`;
      } else {
        patternPrediction.direction = 'neutral';
        patternPrediction.confidence = 0.5;
        patternPrediction.reasoning = 'Mixed signals from historical patterns';
      }
    }

    // Step 5: Time-based prediction (day of week + session patterns)
    const { data: dayPatterns } = await supabase
      .from('chart_analyses')
      .select('*')
      .eq('day_of_week', currentAnalysis.day_of_week)
      .not('actual_outcome', 'is', null)
      .limit(100);

    const timePrediction: EnsemblePrediction = {
      method: 'temporal_analysis',
      direction: 'neutral',
      confidence: 0.5,
      reasoning: 'Insufficient temporal data'
    };

    if (dayPatterns && dayPatterns.length >= 10) {
      const dayBullish = dayPatterns.filter(p => p.actual_outcome === 'bullish' || p.price_direction === 'bullish').length;
      const dayBearish = dayPatterns.filter(p => p.actual_outcome === 'bearish' || p.price_direction === 'bearish').length;
      const dayTotal = dayBullish + dayBearish;

      if (dayBullish / dayTotal > 0.6) {
        timePrediction.direction = 'bullish';
        timePrediction.confidence = dayBullish / dayTotal;
        timePrediction.reasoning = `${currentAnalysis.day_of_week}s are typically bullish (${dayBullish}/${dayTotal})`;
      } else if (dayBearish / dayTotal > 0.6) {
        timePrediction.direction = 'bearish';
        timePrediction.confidence = dayBearish / dayTotal;
        timePrediction.reasoning = `${currentAnalysis.day_of_week}s are typically bearish (${dayBearish}/${dayTotal})`;
      }
    }

    // Step 6: Technical indicator prediction
    const technicalPrediction: EnsemblePrediction = {
      method: 'technical_indicators',
      direction: 'neutral',
      confidence: 0.6,
      reasoning: 'Based on RSI, MACD, and market regime'
    };

    if (rsi > 65 && macd.value > 10) {
      technicalPrediction.direction = 'bullish';
      technicalPrediction.confidence = Math.min(0.85, (rsi / 100 + 0.5));
      technicalPrediction.reasoning = `Strong bullish indicators: RSI ${rsi.toFixed(0)}, MACD ${macd.value.toFixed(1)}`;
    } else if (rsi < 35 && macd.value < -10) {
      technicalPrediction.direction = 'bearish';
      technicalPrediction.confidence = Math.min(0.85, ((100 - rsi) / 100 + 0.5));
      technicalPrediction.reasoning = `Strong bearish indicators: RSI ${rsi.toFixed(0)}, MACD ${macd.value.toFixed(1)}`;
    } else if (rsi > 70) {
      technicalPrediction.direction = 'bearish';
      technicalPrediction.confidence = 0.65;
      technicalPrediction.reasoning = 'Overbought conditions (RSI > 70), potential reversal';
    } else if (rsi < 30) {
      technicalPrediction.direction = 'bullish';
      technicalPrediction.confidence = 0.65;
      technicalPrediction.reasoning = 'Oversold conditions (RSI < 30), potential reversal';
    }

    // Step 7: AI-based prediction (existing method)
    const controller2 = new AbortController();
    const timeoutId2 = setTimeout(() => controller2.abort(), 30000);

    let aiPrediction: EnsemblePrediction = {
      method: 'ai_analysis',
      direction: 'neutral',
      confidence: 0.5,
      reasoning: 'AI analysis unavailable'
    };

    try {
      const predictionResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        signal: controller2.signal,
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `MNQ expert. Predict price direction. JSON only:
{
  "prediction": {
    "price_direction": "bullish/bearish/neutral",
    "confidence_score": 0.75,
    "predicted_move": {
      "direction": "up/down/sideways",
      "magnitude": "small/medium/large",
      "target_levels": [16050, 16100],
      "timeframe": "30min"
    },
    "risk_factors": ["resistance at 16050"],
    "trading_recommendation": {
      "action": "buy/sell/hold/wait",
      "entry_level": 16000,
      "stop_loss": 15980,
      "take_profit": 16050,
      "position_size": "small/medium/large"
    },
    "reasoning": "Detailed explanation"
  }
}`
            },
            {
              role: 'user',
              content: `CURRENT: ${JSON.stringify(currentAnalysis, null, 2)}
              
TOP SIMILAR PATTERNS: ${JSON.stringify(scoredPatterns.slice(0, 10), null, 2)}

Predict MNQ direction. Consider support/resistance proximity.`
            }
          ],
          max_tokens: 1500
        }),
      });

      clearTimeout(timeoutId2);

      if (predictionResponse.ok) {
        const predictionData = await predictionResponse.json();
        const aiResponseText = predictionData.choices[0]?.message?.content;

        if (aiResponseText) {
          try {
            let cleanResponse = aiResponseText.trim()
              .replace(/```json\s*/, '').replace(/```\s*$/, '')
              .replace(/```\s*/, '').replace(/```\s*$/, '');
            
            const jsonStart = cleanResponse.indexOf('{');
            const jsonEnd = cleanResponse.lastIndexOf('}');
            
            if (jsonStart !== -1 && jsonEnd !== -1) {
              cleanResponse = cleanResponse.substring(jsonStart, jsonEnd + 1);
            }
            
            const parsed = JSON.parse(cleanResponse);
            
            if (parsed.prediction) {
              aiPrediction = {
                method: 'ai_analysis',
                direction: parsed.prediction.price_direction || 'neutral',
                confidence: parsed.prediction.confidence_score || 0.5,
                reasoning: parsed.prediction.reasoning || 'AI-based prediction'
              };
            }
          } catch (parseError) {
            console.error('AI prediction parse error:', parseError);
          }
        }
      }
    } catch (aiError) {
      clearTimeout(timeoutId2);
      console.error('AI prediction error:', aiError);
    }

    // Step 8: Ensemble prediction - combine all methods
    const ensembleMethods = [patternPrediction, timePrediction, technicalPrediction, aiPrediction];
    
    // Count consensus
    const bullishVotes = ensembleMethods.filter(m => m.direction === 'bullish');
    const bearishVotes = ensembleMethods.filter(m => m.direction === 'bearish');
    
    let finalDirection = 'neutral';
    let finalConfidence = 0.5;
    let consensusCount = 0;

    if (bullishVotes.length >= 3) {
      finalDirection = 'bullish';
      consensusCount = bullishVotes.length;
      finalConfidence = bullishVotes.reduce((sum, v) => sum + v.confidence, 0) / bullishVotes.length;
    } else if (bearishVotes.length >= 3) {
      finalDirection = 'bearish';
      consensusCount = bearishVotes.length;
      finalConfidence = bearishVotes.reduce((sum, v) => sum + v.confidence, 0) / bearishVotes.length;
    } else {
      finalDirection = 'neutral';
      finalConfidence = 0.5;
    }

    // Step 9: Apply confidence-based filtering
    const meetsConfidenceThreshold = finalConfidence >= 0.70;
    const hasEnoughSimilarPatterns = scoredPatterns.length >= 10;
    const hasConsensus = consensusCount >= 3;

    // Check for conflicting signals
    const nearResistance = currentAnalysis.near_resistance || false;
    const nearSupport = currentAnalysis.near_support || false;

    if (finalDirection === 'bullish' && nearResistance) {
      finalConfidence *= 0.7; // Reduce confidence at resistance
    }
    if (finalDirection === 'bearish' && nearSupport) {
      finalConfidence *= 0.7; // Reduce confidence at support
    }

    // Final recommendation
    let recommendation = 'wait';
    if (meetsConfidenceThreshold && hasConsensus && hasEnoughSimilarPatterns) {
      if (finalDirection === 'bullish') recommendation = 'buy';
      else if (finalDirection === 'bearish') recommendation = 'sell';
    }

    // Calculate price targets
    const currentPrice = currentAnalysis.price_range?.current || 16000;
    const targetLevels = [];
    
    if (finalDirection === 'bullish' && currentAnalysis.resistance_levels?.length > 0) {
      targetLevels.push(currentAnalysis.resistance_levels[0].price);
    } else if (finalDirection === 'bearish' && currentAnalysis.support_levels?.length > 0) {
      targetLevels.push(currentAnalysis.support_levels[0].price);
    }

    // Construct final prediction
    const finalPrediction = {
      current_analysis: {
        ...currentAnalysis,
        technical_indicators: {
          rsi,
          atr,
          macd: macd.value,
          volume_vs_average: volumeVsAvg
        },
        market_regime: marketRegime.regime,
        volatility_regime: marketRegime.volatility
      },
      prediction: {
        price_direction: finalDirection,
        confidence_score: finalConfidence,
        ensemble_agreement: `${consensusCount}/4 methods agree`,
        predicted_move: {
          direction: finalDirection === 'bullish' ? 'up' : finalDirection === 'bearish' ? 'down' : 'sideways',
          magnitude: finalConfidence > 0.8 ? 'medium' : 'small',
          target_levels: targetLevels,
          timeframe: '30min'
        },
        similar_patterns: scoredPatterns.slice(0, 10).map(p => ({
          date: p.chart_date,
          similarity_score: p.similarity_score,
          outcome: p.actual_outcome || p.price_direction,
          reasoning: `${p.sentiment_label} on ${p.day_of_week} during ${p.session_details?.session_type || 'session'}`
        })),
        ensemble_breakdown: ensembleMethods.map(m => ({
          method: m.method,
          direction: m.direction,
          confidence: m.confidence,
          reasoning: m.reasoning
        })),
        risk_factors: [
          ...(nearResistance ? ['Near resistance level'] : []),
          ...(nearSupport ? ['Near support level'] : []),
          ...(finalConfidence < 0.75 ? ['Below ideal confidence threshold'] : []),
          ...(scoredPatterns.length < 10 ? ['Limited historical pattern data'] : []),
          ...(marketRegime.volatility === 'high' ? ['High volatility environment'] : [])
        ],
        trading_recommendation: {
          action: recommendation,
          entry_level: recommendation !== 'wait' ? currentPrice : null,
          stop_loss: recommendation === 'buy' ? currentPrice - atr * 1.5 : 
                     recommendation === 'sell' ? currentPrice + atr * 1.5 : null,
          take_profit: targetLevels[0] || null,
          position_size: finalConfidence > 0.80 ? 'medium' : 'small'
        },
        reasoning: `Ensemble prediction with ${consensusCount}/4 methods agreeing on ${finalDirection} direction. ${finalConfidence >= 0.70 ? 'High confidence setup.' : 'Moderate confidence - wait for confirmation.'} Pattern analysis: ${scoredPatterns.length} similar historical patterns found.`,
        quality_metrics: {
          meets_confidence_threshold: meetsConfidenceThreshold,
          has_enough_patterns: hasEnoughSimilarPatterns,
          has_consensus: hasConsensus,
          overall_quality: meetsConfidenceThreshold && hasEnoughSimilarPatterns && hasConsensus ? 'HIGH' : 'MEDIUM'
        }
      },
      historical_patterns_count: historicalData?.length || 0,
      similar_patterns_count: scoredPatterns.length
    };

    // Save prediction for tracking
    const { error: feedbackError } = await supabase
      .from('prediction_feedback')
      .insert({
        predicted_direction: finalDirection,
        predicted_price_target: targetLevels[0],
        predicted_timeframe_minutes: 30,
        confidence_score: finalConfidence,
        conditions: {
          day_of_week: currentAnalysis.day_of_week,
          session_type: currentAnalysis.session_type,
          market_regime: marketRegime.regime,
          volatility_regime: marketRegime.volatility,
          rsi,
          near_resistance: nearResistance,
          near_support: nearSupport
        },
        pattern_type: currentAnalysis.pattern_type || 'unknown',
        similar_patterns_used: scoredPatterns.length,
        ensemble_agreement_score: consensusCount / 4
      });

    if (feedbackError) {
      console.error('Error saving prediction feedback:', feedbackError);
    }

    console.log(`Prediction complete: ${finalDirection} with ${(finalConfidence * 100).toFixed(0)}% confidence`);

    return new Response(JSON.stringify(finalPrediction), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in predict-chart-enhanced:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: 'Failed to generate enhanced prediction'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
