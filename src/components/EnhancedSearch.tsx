import React, { useState, useEffect } from 'react';
import { Search, Star, Save, Trash2, Filter, Clock, Bookmark } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface EnhancedSearchProps {
  onSearchResults?: (results: any[]) => void;
  onFiltersChange?: (filters: any) => void;
  className?: string;
}

interface SavedSearch {
  id: string;
  search_name: string;
  search_description: string;
  search_criteria: any;
  is_favorite: boolean;
  use_count: number;
  created_at: string;
}

interface SearchFilters {
  query: string;
  patternTypes: string[];
  tags: string[];
  confidenceMin: number;
  confidenceMax: number;
  dateFrom: Date | null;
  dateTo: Date | null;
  hasNotes: boolean;
  hasPredictions: boolean;
}

export function EnhancedSearch({ onSearchResults, onFiltersChange, className }: EnhancedSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [availablePatternTypes, setAvailablePatternTypes] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    patternTypes: [],
    tags: [],
    confidenceMin: 0,
    confidenceMax: 100,
    dateFrom: null,
    dateTo: null,
    hasNotes: false,
    hasPredictions: false
  });
  const [saveSearchData, setSaveSearchData] = useState({
    name: '',
    description: '',
    isFavorite: false
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSavedSearches();
    loadPatternTypes();
    loadTags();
  }, []);

  useEffect(() => {
    onFiltersChange?.(filters);
  }, [filters, onFiltersChange]);

  const loadSavedSearches = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('data-management', {
        body: { action: 'get_saved_searches' }
      });

      if (error) throw error;
      setSavedSearches(data.searches || []);
    } catch (error) {
      console.error('Error loading saved searches:', error);
    }
  };

  const loadPatternTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('chart_analyses')
        .select('pattern_type')
        .order('pattern_type');

      if (error) throw error;
      
      const uniqueTypes = [...new Set(data.map(item => item.pattern_type))].filter(Boolean);
      setAvailablePatternTypes(uniqueTypes);
    } catch (error) {
      console.error('Error loading pattern types:', error);
    }
  };

  const loadTags = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('data-management', {
        body: { action: 'manage_tags', data: { operation: 'list' } }
      });

      if (error) throw error;
      setAvailableTags(data.tags || []);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() && filters.patternTypes.length === 0 && filters.tags.length === 0) {
      toast({
        title: "Search Query Required",
        description: "Please enter a search term or apply filters.",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);

    try {
      const { data, error } = await supabase.functions.invoke('data-management', {
        body: {
          action: 'search_patterns',
          data: {
            query: searchQuery,
            filters: {
              patternTypes: filters.patternTypes.length > 0 ? filters.patternTypes : undefined,
              tags: filters.tags.length > 0 ? filters.tags : undefined,
              confidenceMin: filters.confidenceMin > 0 ? filters.confidenceMin : undefined,
              confidenceMax: filters.confidenceMax < 100 ? filters.confidenceMax : undefined
            },
            limit: 100
          }
        }
      });

      if (error) throw error;

      onSearchResults?.(data.results || []);
      
      toast({
        title: "Search Complete",
        description: `Found ${data.resultCount} matching patterns.`
      });

    } catch (error) {
      console.error('Error searching patterns:', error);
      toast({
        title: "Search Failed",
        description: "Failed to search patterns. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const saveCurrentSearch = async () => {
    if (!saveSearchData.name.trim()) {
      toast({
        title: "Search Name Required",
        description: "Please enter a name for this search.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('data-management', {
        body: {
          action: 'save_search',
          data: {
            searchName: saveSearchData.name,
            searchDescription: saveSearchData.description,
            searchCriteria: {
              query: searchQuery,
              filters
            },
            isFavorite: saveSearchData.isFavorite
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Search Saved",
        description: "Your search has been saved successfully."
      });

      setShowSaveDialog(false);
      setSaveSearchData({ name: '', description: '', isFavorite: false });
      loadSavedSearches();

    } catch (error) {
      console.error('Error saving search:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save search. Please try again.",
        variant: "destructive"
      });
    }
  };

  const loadSavedSearch = (savedSearch: SavedSearch) => {
    const criteria = savedSearch.search_criteria;
    setSearchQuery(criteria.query || '');
    setFilters(criteria.filters || {
      query: '',
      patternTypes: [],
      tags: [],
      confidenceMin: 0,
      confidenceMax: 100,
      dateFrom: null,
      dateTo: null,
      hasNotes: false,
      hasPredictions: false
    });

    toast({
      title: "Search Loaded",
      description: `Loaded search: ${savedSearch.search_name}`
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({
      query: '',
      patternTypes: [],
      tags: [],
      confidenceMin: 0,
      confidenceMax: 100,
      dateFrom: null,
      dateTo: null,
      hasNotes: false,
      hasPredictions: false
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Advanced Pattern Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search patterns, filenames, descriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </div>

          {/* Advanced Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Pattern Types */}
            <div className="space-y-2">
              <Label>Pattern Types</Label>
              <Select onValueChange={(value) => {
                if (value && !filters.patternTypes.includes(value)) {
                  setFilters(prev => ({ 
                    ...prev, 
                    patternTypes: [...prev.patternTypes, value] 
                  }));
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  {availablePatternTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {filters.patternTypes.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {filters.patternTypes.map(type => (
                    <Badge 
                      key={type} 
                      variant="secondary" 
                      className="text-xs cursor-pointer"
                      onClick={() => setFilters(prev => ({
                        ...prev,
                        patternTypes: prev.patternTypes.filter(t => t !== type)
                      }))}
                    >
                      {type} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <Select onValueChange={(value) => {
                if (value && !filters.tags.includes(value)) {
                  setFilters(prev => ({ 
                    ...prev, 
                    tags: [...prev.tags, value] 
                  }));
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by tags" />
                </SelectTrigger>
                <SelectContent>
                  {availableTags.map(tag => (
                    <SelectItem key={tag.id} value={tag.id}>{tag.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {filters.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {filters.tags.map(tagId => {
                    const tag = availableTags.find(t => t.id === tagId);
                    return tag ? (
                      <Badge 
                        key={tagId} 
                        variant="secondary" 
                        className="text-xs cursor-pointer"
                        style={{ backgroundColor: tag.color_hex + '20', color: tag.color_hex }}
                        onClick={() => setFilters(prev => ({
                          ...prev,
                          tags: prev.tags.filter(t => t !== tagId)
                        }))}
                      >
                        {tag.name} ×
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            {/* Additional Filters */}
            <div className="space-y-2">
              <Label>Additional Filters</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasNotes"
                    checked={filters.hasNotes}
                    onCheckedChange={(checked) => 
                      setFilters(prev => ({ ...prev, hasNotes: !!checked }))
                    }
                  />
                  <Label htmlFor="hasNotes" className="text-sm">Has Notes</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasPredictions"
                    checked={filters.hasPredictions}
                    onCheckedChange={(checked) => 
                      setFilters(prev => ({ ...prev, hasPredictions: !!checked }))
                    }
                  />
                  <Label htmlFor="hasPredictions" className="text-sm">Has Predictions</Label>
                </div>
              </div>
            </div>

            {/* Save Search */}
            <div className="space-y-2">
              <Label>Save Search</Label>
              <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    Save Current Search
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Search</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="searchName">Search Name</Label>
                      <Input
                        id="searchName"
                        placeholder="e.g., High Confidence Breakouts"
                        value={saveSearchData.name}
                        onChange={(e) => setSaveSearchData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="searchDescription">Description (optional)</Label>
                      <Textarea
                        id="searchDescription"
                        placeholder="Describe what this search is for..."
                        value={saveSearchData.description}
                        onChange={(e) => setSaveSearchData(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isFavorite"
                        checked={saveSearchData.isFavorite}
                        onCheckedChange={(checked) => 
                          setSaveSearchData(prev => ({ ...prev, isFavorite: !!checked }))
                        }
                      />
                      <Label htmlFor="isFavorite" className="text-sm">Mark as favorite</Label>
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button variant="outline" onClick={() => setShowSaveDialog(false)} className="flex-1">
                        Cancel
                      </Button>
                      <Button onClick={saveCurrentSearch} className="flex-1">
                        Save Search
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bookmark className="w-4 h-4 text-primary" />
              Saved Searches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedSearches.map((search) => (
                <Card 
                  key={search.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => loadSavedSearch(search)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {search.is_favorite && <Star className="w-3 h-3 text-primary fill-current" />}
                        <p className="font-medium text-sm">{search.search_name}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {search.use_count} uses
                      </Badge>
                    </div>
                    
                    {search.search_description && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {search.search_description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {new Date(search.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}