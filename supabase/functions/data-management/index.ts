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
    const { action, data } = await req.json();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let result = {};

    switch (action) {
      case 'export_patterns':
        result = await exportPatterns(supabase, data);
        break;
        
      case 'bulk_tag_patterns':
        result = await bulkTagPatterns(supabase, data);
        break;
        
      case 'bulk_delete_patterns':
        result = await bulkDeletePatterns(supabase, data);
        break;
        
      case 'search_patterns':
        result = await searchPatterns(supabase, data);
        break;
        
      case 'save_search':
        result = await saveSearch(supabase, data);
        break;
        
      case 'get_saved_searches':
        result = await getSavedSearches(supabase);
        break;
        
      case 'add_pattern_note':
        result = await addPatternNote(supabase, data);
        break;
        
      case 'get_pattern_notes':
        result = await getPatternNotes(supabase, data);
        break;
        
      case 'manage_tags':
        result = await manageTags(supabase, data);
        break;
        
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in data-management function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function exportPatterns(supabase: any, data: any) {
  try {
    const { format, filters, chartIds } = data;
    
    let query = supabase
      .from('chart_analyses')
      .select(`
        *,
        pattern_notes(note_title, note_content, note_type),
        chart_analysis_tags(pattern_tags(name, color_hex)),
        prediction_outcomes(predicted_direction, actual_outcome, confidence_score, predicted_at, validated_at)
      `);

    // Apply filters
    if (chartIds && chartIds.length > 0) {
      query = query.in('id', chartIds);
    }

    if (filters) {
      if (filters.patternTypes && filters.patternTypes.length > 0) {
        query = query.in('pattern_type', filters.patternTypes);
      }
      
      if (filters.confidenceMin !== undefined) {
        query = query.gte('confidence_score', filters.confidenceMin);
      }
      
      if (filters.confidenceMax !== undefined) {
        query = query.lte('confidence_score', filters.confidenceMax);
      }
      
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }
    }

    const { data: patterns, error } = await query;
    
    if (error) throw error;

    // Create export job record
    const { data: exportJob, error: jobError } = await supabase
      .from('export_jobs')
      .insert({
        export_type: format,
        export_criteria: { filters, chartIds },
        status: 'processing',
        record_count: patterns?.length || 0
      })
      .select()
      .single();

    if (jobError) throw jobError;

    let exportData: any;
    let filename: string;
    let contentType: string;

    switch (format) {
      case 'csv':
        exportData = await generateCSV(patterns);
        filename = `mnq-patterns-${new Date().toISOString().split('T')[0]}.csv`;
        contentType = 'text/csv';
        break;
        
      case 'json':
        exportData = JSON.stringify(patterns, null, 2);
        filename = `mnq-patterns-${new Date().toISOString().split('T')[0]}.json`;
        contentType = 'application/json';
        break;
        
      case 'pdf':
        exportData = await generatePDF(patterns);
        filename = `mnq-patterns-${new Date().toISOString().split('T')[0]}.pdf`;
        contentType = 'application/pdf';
        break;
        
      default:
        throw new Error('Unsupported export format');
    }

    // Update export job as completed
    await supabase
      .from('export_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', exportJob.id);

    return {
      success: true,
      exportJob: exportJob.id,
      filename,
      contentType,
      data: exportData,
      recordCount: patterns?.length || 0
    };

  } catch (error) {
    console.error('Error exporting patterns:', error);
    throw error;
  }
}

async function generateCSV(patterns: any[]) {
  const headers = [
    'ID', 'Pattern Type', 'Confidence Score', 'Filename', 'Session Time', 
    'Day of Week', 'Price Direction', 'Created At', 'Tags', 'Notes'
  ];
  
  const rows = patterns.map(pattern => [
    pattern.id,
    pattern.pattern_type || '',
    pattern.confidence_score || 0,
    pattern.filename || '',
    pattern.session_details?.session_time || '',
    pattern.day_of_week || '',
    pattern.price_direction || '',
    new Date(pattern.created_at).toISOString(),
    pattern.chart_analysis_tags?.map((tag: any) => tag.pattern_tags?.name).join('; ') || '',
    pattern.pattern_notes?.map((note: any) => `${note.note_title}: ${note.note_content}`).join('; ') || ''
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return csvContent;
}

async function generatePDF(patterns: any[]) {
  // For now, return a simple text-based PDF content
  // In a real implementation, you would use a PDF library
  const content = `MNQ Pattern Analysis Report
Generated: ${new Date().toISOString()}
Total Patterns: ${patterns.length}

${patterns.map((pattern, index) => `
${index + 1}. ${pattern.pattern_type} (${pattern.confidence_score}%)
   File: ${pattern.filename}
   Date: ${new Date(pattern.created_at).toLocaleDateString()}
   Session: ${pattern.session_details?.session_time || 'N/A'}
   Direction: ${pattern.price_direction || 'N/A'}
   ${pattern.pattern_notes?.length ? `Notes: ${pattern.pattern_notes.map((n: any) => n.note_content).join('; ')}` : ''}
`).join('\n')}`;

  return content;
}

async function bulkTagPatterns(supabase: any, data: any) {
  try {
    const { chartIds, tagIds, operation } = data; // operation: 'add' or 'remove'
    
    if (operation === 'add') {
      const insertData = [];
      for (const chartId of chartIds) {
        for (const tagId of tagIds) {
          insertData.push({
            chart_analysis_id: chartId,
            tag_id: tagId
          });
        }
      }
      
      const { error } = await supabase
        .from('chart_analysis_tags')
        .upsert(insertData, { onConflict: 'chart_analysis_id,tag_id' });
        
      if (error) throw error;
      
    } else if (operation === 'remove') {
      const { error } = await supabase
        .from('chart_analysis_tags')
        .delete()
        .in('chart_analysis_id', chartIds)
        .in('tag_id', tagIds);
        
      if (error) throw error;
    }

    return {
      success: true,
      operation,
      affectedCharts: chartIds.length,
      affectedTags: tagIds.length
    };

  } catch (error) {
    console.error('Error in bulk tag operation:', error);
    throw error;
  }
}

async function bulkDeletePatterns(supabase: any, data: any) {
  try {
    const { chartIds } = data;
    
    // Delete chart analyses (cascade will handle related records)
    const { error } = await supabase
      .from('chart_analyses')
      .delete()
      .in('id', chartIds);
      
    if (error) throw error;

    return {
      success: true,
      deletedCount: chartIds.length
    };

  } catch (error) {
    console.error('Error in bulk delete operation:', error);
    throw error;
  }
}

async function searchPatterns(supabase: any, data: any) {
  try {
    const { query: searchQuery, filters, limit = 50 } = data;
    
    let query = supabase
      .from('chart_analyses')
      .select(`
        *,
        pattern_notes(note_title, note_content),
        chart_analysis_tags(pattern_tags(name, color_hex))
      `);

    // Full-text search
    if (searchQuery && searchQuery.trim()) {
      query = query.textSearch('search_vector', searchQuery.trim());
    }

    // Apply additional filters
    if (filters) {
      if (filters.patternTypes && filters.patternTypes.length > 0) {
        query = query.in('pattern_type', filters.patternTypes);
      }
      
      if (filters.tags && filters.tags.length > 0) {
        // Join with tags
        query = query.in('chart_analysis_tags.tag_id', filters.tags);
      }
      
      if (filters.confidenceMin !== undefined) {
        query = query.gte('confidence_score', filters.confidenceMin);
      }
      
      if (filters.confidenceMax !== undefined) {
        query = query.lte('confidence_score', filters.confidenceMax);
      }
    }

    query = query.limit(limit).order('created_at', { ascending: false });

    const { data: results, error } = await query;
    
    if (error) throw error;

    return {
      success: true,
      results: results || [],
      query: searchQuery,
      resultCount: results?.length || 0
    };

  } catch (error) {
    console.error('Error searching patterns:', error);
    throw error;
  }
}

async function saveSearch(supabase: any, data: any) {
  try {
    const { searchName, searchDescription, searchCriteria, isFavorite } = data;
    
    const { data: savedSearch, error } = await supabase
      .from('saved_searches')
      .insert({
        search_name: searchName,
        search_description: searchDescription,
        search_criteria: searchCriteria,
        is_favorite: isFavorite || false
      })
      .select()
      .single();
      
    if (error) throw error;

    return {
      success: true,
      savedSearch
    };

  } catch (error) {
    console.error('Error saving search:', error);
    throw error;
  }
}

async function getSavedSearches(supabase: any) {
  try {
    const { data: searches, error } = await supabase
      .from('saved_searches')
      .select('*')
      .order('is_favorite', { ascending: false })
      .order('use_count', { ascending: false })
      .order('created_at', { ascending: false });
      
    if (error) throw error;

    return {
      success: true,
      searches: searches || []
    };

  } catch (error) {
    console.error('Error getting saved searches:', error);
    throw error;
  }
}

async function addPatternNote(supabase: any, data: any) {
  try {
    const { chartAnalysisId, noteTitle, noteContent, noteType, isPrivate } = data;
    
    const { data: note, error } = await supabase
      .from('pattern_notes')
      .insert({
        chart_analysis_id: chartAnalysisId,
        note_title: noteTitle,
        note_content: noteContent,
        note_type: noteType || 'general',
        is_private: isPrivate !== false // default to true
      })
      .select()
      .single();
      
    if (error) throw error;

    return {
      success: true,
      note
    };

  } catch (error) {
    console.error('Error adding pattern note:', error);
    throw error;
  }
}

async function getPatternNotes(supabase: any, data: any) {
  try {
    const { chartAnalysisId } = data;
    
    const { data: notes, error } = await supabase
      .from('pattern_notes')
      .select('*')
      .eq('chart_analysis_id', chartAnalysisId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;

    return {
      success: true,
      notes: notes || []
    };

  } catch (error) {
    console.error('Error getting pattern notes:', error);
    throw error;
  }
}

async function manageTags(supabase: any, data: any) {
  try {
    const { operation, tagData } = data; // operation: 'create', 'update', 'delete', 'list'
    
    switch (operation) {
      case 'create':
        const { data: newTag, error: createError } = await supabase
          .from('pattern_tags')
          .insert({
            name: tagData.name,
            description: tagData.description,
            color_hex: tagData.color_hex || '#3B82F6'
          })
          .select()
          .single();
          
        if (createError) throw createError;
        return { success: true, tag: newTag };
        
      case 'update':
        const { data: updatedTag, error: updateError } = await supabase
          .from('pattern_tags')
          .update({
            name: tagData.name,
            description: tagData.description,
            color_hex: tagData.color_hex
          })
          .eq('id', tagData.id)
          .select()
          .single();
          
        if (updateError) throw updateError;
        return { success: true, tag: updatedTag };
        
      case 'delete':
        const { error: deleteError } = await supabase
          .from('pattern_tags')
          .delete()
          .eq('id', tagData.id);
          
        if (deleteError) throw deleteError;
        return { success: true, deletedId: tagData.id };
        
      case 'list':
      default:
        const { data: tags, error: listError } = await supabase
          .from('pattern_tags')
          .select('*')
          .order('name');
          
        if (listError) throw listError;
        return { success: true, tags: tags || [] };
    }

  } catch (error) {
    console.error('Error managing tags:', error);
    throw error;
  }
}