import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sourceImageId, targetImageIds, algorithm = 'ai_visual' } = await req.json();
    
    if (!sourceImageId || !targetImageIds || !Array.isArray(targetImageIds)) {
      return new Response(
        JSON.stringify({ error: 'sourceImageId and targetImageIds array are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get Lovable AI API key
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Computing similarities for source ${sourceImageId} against ${targetImageIds.length} targets`);

    // Fetch source chart analysis
    const { data: sourceChart, error: sourceError } = await supabase
      .from('chart_analyses')
      .select('*')
      .eq('id', sourceImageId)
      .single();

    if (sourceError || !sourceChart) {
      return new Response(
        JSON.stringify({ error: 'Source chart not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch target chart analyses
    const { data: targetCharts, error: targetError } = await supabase
      .from('chart_analyses')
      .select('*')
      .in('id', targetImageIds);

    if (targetError || !targetCharts) {
      return new Response(
        JSON.stringify({ error: 'Target charts not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const similarities = [];

    for (const targetChart of targetCharts) {
      try {
        // Check if similarity already exists
        const { data: existing } = await supabase
          .from('pattern_similarities')
          .select('*')
          .eq('source_chart_id', sourceImageId)
          .eq('target_chart_id', targetChart.id)
          .eq('algorithm_used', algorithm)
          .single();

        if (existing) {
          similarities.push(existing);
          continue;
        }

        let similarityScore = 0;
        let similarityFeatures = {};

        if (algorithm === 'ai_visual') {
          // Use AI to compute visual similarity
          const aiPrompt = `Compare these two MNQ chart patterns and provide a similarity score (0-100) based on:
          
          Chart 1:
          - Pattern: ${sourceChart.pattern_type}
          - Confidence: ${sourceChart.confidence_score}%
          - Session: ${sourceChart.session_details || 'N/A'}
          - Key Levels: ${JSON.stringify(sourceChart.key_levels || [])}
          - Features: ${JSON.stringify(sourceChart.pattern_features || {})}
          
          Chart 2:
          - Pattern: ${targetChart.pattern_type}
          - Confidence: ${targetChart.confidence_score}%
          - Session: ${targetChart.session_details || 'N/A'}
          - Key Levels: ${JSON.stringify(targetChart.key_levels || [])}
          - Features: ${JSON.stringify(targetChart.pattern_features || {})}
          
          Analyze similarity based on:
          1. Pattern type match (40% weight)
          2. Technical structure similarity (30% weight)
          3. Market context similarity (20% weight)
          4. Confidence correlation (10% weight)
          
          Return JSON: {
            "similarity_score": number (0-100),
            "pattern_match": number (0-100),
            "technical_similarity": number (0-100),
            "context_similarity": number (0-100),
            "confidence_correlation": number (0-100),
            "reasoning": "brief explanation"
          }`;

          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                {
                  role: 'system',
                  content: 'You are an expert MNQ futures pattern analysis AI. Provide precise technical analysis with numerical scores.'
                },
                {
                  role: 'user',
                  content: aiPrompt
                }
              ],
              temperature: 0.3
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const aiContent = aiData.choices?.[0]?.message?.content;
            
            try {
              // Clean AI response and parse JSON
              const cleanedContent = aiContent.replace(/```json\n?|\n?```/g, '').trim();
              const aiResult = JSON.parse(cleanedContent);
              
              similarityScore = Math.min(100, Math.max(0, aiResult.similarity_score || 0));
              similarityFeatures = {
                pattern_match: aiResult.pattern_match || 0,
                technical_similarity: aiResult.technical_similarity || 0,
                context_similarity: aiResult.context_similarity || 0,
                confidence_correlation: aiResult.confidence_correlation || 0,
                reasoning: aiResult.reasoning || 'AI analysis completed',
                algorithm: 'ai_visual'
              };
            } catch (parseError) {
              console.error('AI response parsing error:', parseError);
              // Fallback to pattern-based scoring
              similarityScore = sourceChart.pattern_type === targetChart.pattern_type ? 75 : 25;
              similarityFeatures = { error: 'AI parsing failed, used fallback' };
            }
          } else {
            // Fallback scoring method
            similarityScore = sourceChart.pattern_type === targetChart.pattern_type ? 70 : 20;
            similarityFeatures = { method: 'fallback_pattern_match' };
          }
        } else {
          // Pattern matching algorithm (fallback)
          const patternMatch = sourceChart.pattern_type === targetChart.pattern_type ? 80 : 0;
          const confidenceMatch = 100 - Math.abs(sourceChart.confidence_score - targetChart.confidence_score);
          const sessionMatch = sourceChart.session_details === targetChart.session_details ? 70 : 30;
          
          similarityScore = (patternMatch * 0.5 + confidenceMatch * 0.3 + sessionMatch * 0.2);
          similarityFeatures = {
            pattern_match: patternMatch,
            confidence_match: confidenceMatch,
            session_match: sessionMatch,
            algorithm: 'pattern_matching'
          };
        }

        // Store similarity result
        const { data: similarity, error: insertError } = await supabase
          .from('pattern_similarities')
          .insert({
            source_chart_id: sourceImageId,
            target_chart_id: targetChart.id,
            similarity_score: similarityScore,
            similarity_features: similarityFeatures,
            algorithm_used: algorithm
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting similarity:', insertError);
        } else {
          similarities.push(similarity);
        }

      } catch (error) {
        console.error(`Error computing similarity with chart ${targetChart.id}:`, error);
      }
    }

    // Sort by similarity score descending
    similarities.sort((a, b) => b.similarity_score - a.similarity_score);

    return new Response(
      JSON.stringify({ 
        similarities: similarities.slice(0, 5), // Return top 5 matches
        total_computed: similarities.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in pattern-similarity function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});