import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit2, Trash2, StickyNote, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface NotesAndTagsManagerProps {
  chartAnalysisId: string;
  className?: string;
  onNotesChange?: () => void;
  onTagsChange?: () => void;
}

interface PatternNote {
  id: string;
  note_title: string | null;
  note_content: string;
  note_type: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

interface PatternTag {
  id: string;
  name: string;
  description: string | null;
  color_hex: string;
}

interface ChartTag {
  id: string;
  tag_id: string;
  pattern_tags: PatternTag;
  added_at: string;
}

const NOTE_TYPES = [
  { value: 'general', label: 'General Note', color: 'text-muted-foreground' },
  { value: 'strategy', label: 'Trading Strategy', color: 'text-bullish' },
  { value: 'observation', label: 'Market Observation', color: 'text-primary' },
  { value: 'warning', label: 'Risk Warning', color: 'text-bearish' }
];

const DEFAULT_TAG_COLORS = [
  '#22C55E', '#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6', 
  '#06B6D4', '#EC4899', '#10B981', '#F97316', '#6366F1'
];

export function NotesAndTagsManager({ 
  chartAnalysisId, 
  className, 
  onNotesChange, 
  onTagsChange 
}: NotesAndTagsManagerProps) {
  const [notes, setNotes] = useState<PatternNote[]>([]);
  const [chartTags, setChartTags] = useState<ChartTag[]>([]);
  const [availableTags, setAvailableTags] = useState<PatternTag[]>([]);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    type: 'general',
    isPrivate: true
  });
  const [newTag, setNewTag] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });
  const { toast } = useToast();

  useEffect(() => {
    loadNotes();
    loadChartTags();
    loadAvailableTags();
  }, [chartAnalysisId]);

  const loadNotes = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('data-management', {
        body: {
          action: 'get_pattern_notes',
          data: { chartAnalysisId }
        }
      });

      if (error) throw error;
      setNotes(data.notes || []);
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const loadChartTags = async () => {
    try {
      const { data, error } = await supabase
        .from('chart_analysis_tags')
        .select(`
          id,
          tag_id,
          added_at,
          pattern_tags(id, name, description, color_hex)
        `)
        .eq('chart_analysis_id', chartAnalysisId);

      if (error) throw error;
      setChartTags(data || []);
    } catch (error) {
      console.error('Error loading chart tags:', error);
    }
  };

  const loadAvailableTags = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('data-management', {
        body: { action: 'manage_tags', data: { operation: 'list' } }
      });

      if (error) throw error;
      setAvailableTags(data.tags || []);
    } catch (error) {
      console.error('Error loading available tags:', error);
    }
  };

  const addNote = async () => {
    if (!newNote.content.trim()) {
      toast({
        title: "Note Content Required",
        description: "Please enter note content.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('data-management', {
        body: {
          action: 'add_pattern_note',
          data: {
            chartAnalysisId,
            noteTitle: newNote.title || null,
            noteContent: newNote.content,
            noteType: newNote.type,
            isPrivate: newNote.isPrivate
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Note Added",
        description: "Your note has been saved successfully."
      });

      setNewNote({ title: '', content: '', type: 'general', isPrivate: true });
      setIsAddingNote(false);
      loadNotes();
      onNotesChange?.();

    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "Error Adding Note",
        description: "Failed to save note. Please try again.",
        variant: "destructive"
      });
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('pattern_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      toast({
        title: "Note Deleted",
        description: "Note has been removed successfully."
      });

      loadNotes();
      onNotesChange?.();

    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error Deleting Note",
        description: "Failed to delete note. Please try again.",
        variant: "destructive"
      });
    }
  };

  const addTagToChart = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from('chart_analysis_tags')
        .insert({
          chart_analysis_id: chartAnalysisId,
          tag_id: tagId
        });

      if (error) throw error;

      toast({
        title: "Tag Added",
        description: "Tag has been applied to this pattern."
      });

      setIsAddingTag(false);
      loadChartTags();
      onTagsChange?.();

    } catch (error) {
      console.error('Error adding tag:', error);
      toast({
        title: "Error Adding Tag",
        description: "Failed to add tag. Please try again.",
        variant: "destructive"
      });
    }
  };

  const removeTagFromChart = async (chartTagId: string) => {
    try {
      const { error } = await supabase
        .from('chart_analysis_tags')
        .delete()
        .eq('id', chartTagId);

      if (error) throw error;

      toast({
        title: "Tag Removed",
        description: "Tag has been removed from this pattern."
      });

      loadChartTags();
      onTagsChange?.();

    } catch (error) {
      console.error('Error removing tag:', error);
      toast({
        title: "Error Removing Tag",
        description: "Failed to remove tag. Please try again.",
        variant: "destructive"
      });
    }
  };

  const createTag = async () => {
    if (!newTag.name.trim()) {
      toast({
        title: "Tag Name Required",
        description: "Please enter a tag name.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('data-management', {
        body: {
          action: 'manage_tags',
          data: {
            operation: 'create',
            tagData: {
              name: newTag.name,
              description: newTag.description,
              color_hex: newTag.color
            }
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Tag Created",
        description: "New tag has been created successfully."
      });

      setNewTag({ name: '', description: '', color: '#3B82F6' });
      setShowCreateTag(false);
      loadAvailableTags();

    } catch (error) {
      console.error('Error creating tag:', error);
      toast({
        title: "Error Creating Tag",
        description: "Failed to create tag. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getNoteTypeInfo = (type: string) => {
    return NOTE_TYPES.find(nt => nt.value === type) || NOTE_TYPES[0];
  };

  const getAvailableTagsForChart = () => {
    const appliedTagIds = chartTags.map(ct => ct.tag_id);
    return availableTags.filter(tag => !appliedTagIds.includes(tag.id));
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Tags Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" />
              Tags
            </div>
            <div className="flex gap-2">
              {getAvailableTagsForChart().length > 0 && (
                <Popover open={isAddingTag} onOpenChange={setIsAddingTag}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="w-3 h-3 mr-1" />
                      Add Tag
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56">
                    <div className="space-y-2">
                      <Label>Select Tag</Label>
                      <div className="space-y-1">
                        {getAvailableTagsForChart().map(tag => (
                          <Button
                            key={tag.id}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => addTagToChart(tag.id)}
                          >
                            <div 
                              className="w-3 h-3 rounded-full mr-2" 
                              style={{ backgroundColor: tag.color_hex }}
                            />
                            {tag.name}
                          </Button>
                        ))}
                      </div>
                      
                      <Dialog open={showCreateTag} onOpenChange={setShowCreateTag}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full">
                            <Plus className="w-3 h-3 mr-1" />
                            Create New Tag
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create New Tag</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="tagName">Tag Name</Label>
                              <Input
                                id="tagName"
                                placeholder="e.g., High Volume"
                                value={newTag.name}
                                onChange={(e) => setNewTag(prev => ({ ...prev, name: e.target.value }))}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="tagDescription">Description (optional)</Label>
                              <Textarea
                                id="tagDescription"
                                placeholder="Describe when to use this tag..."
                                value={newTag.description}
                                onChange={(e) => setNewTag(prev => ({ ...prev, description: e.target.value }))}
                                rows={2}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Color</Label>
                              <div className="flex gap-2">
                                {DEFAULT_TAG_COLORS.map(color => (
                                  <button
                                    key={color}
                                    className={cn(
                                      "w-6 h-6 rounded-full border-2",
                                      newTag.color === color ? "border-foreground" : "border-muted"
                                    )}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setNewTag(prev => ({ ...prev, color }))}
                                  />
                                ))}
                              </div>
                            </div>
                            
                            <div className="flex gap-2 pt-4">
                              <Button variant="outline" onClick={() => setShowCreateTag(false)} className="flex-1">
                                Cancel
                              </Button>
                              <Button onClick={createTag} className="flex-1">
                                Create Tag
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {chartTags.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tags applied to this pattern.</p>
            ) : (
              chartTags.map((chartTag) => (
                <Badge
                  key={chartTag.id}
                  variant="secondary"
                  className="cursor-pointer hover:opacity-80"
                  style={{ 
                    backgroundColor: chartTag.pattern_tags.color_hex + '20', 
                    color: chartTag.pattern_tags.color_hex,
                    borderColor: chartTag.pattern_tags.color_hex + '40'
                  }}
                  onClick={() => removeTagFromChart(chartTag.id)}
                >
                  {chartTag.pattern_tags.name}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-primary" />
              Notes ({notes.length})
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsAddingNote(true)}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Note
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Note Form */}
          {isAddingNote && (
            <Card className="border-dashed">
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="noteTitle">Title (optional)</Label>
                    <Input
                      id="noteTitle"
                      placeholder="Note title..."
                      value={newNote.title}
                      onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="noteType">Type</Label>
                    <Select value={newNote.type} onValueChange={(value) => setNewNote(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NOTE_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="noteContent">Content</Label>
                  <Textarea
                    id="noteContent"
                    placeholder="Enter your note here..."
                    value={newNote.content}
                    onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button onClick={addNote} size="sm">
                      <Save className="w-3 h-3 mr-1" />
                      Save Note
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setIsAddingNote(false);
                        setNewNote({ title: '', content: '', type: 'general', isPrivate: true });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing Notes */}
          <div className="space-y-3">
            {notes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No notes added to this pattern yet.
              </p>
            ) : (
              notes.map((note) => {
                const typeInfo = getNoteTypeInfo(note.note_type);
                return (
                  <Card key={note.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {note.note_title && (
                              <h4 className="font-medium text-sm">{note.note_title}</h4>
                            )}
                            <Badge variant="outline" className={typeInfo.color}>
                              {typeInfo.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {note.note_content}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(note.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNote(note.id)}
                          className="ml-2"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
