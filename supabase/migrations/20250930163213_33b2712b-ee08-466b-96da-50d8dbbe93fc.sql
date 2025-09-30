-- Add user_id column to pattern_notes table to track ownership
ALTER TABLE public.pattern_notes
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- For existing notes, we cannot assign them to a user, so they will remain null
-- In production, you would want to either assign them to a specific user or delete them
-- For now, we'll leave them as null and the RLS will prevent access to them

-- Drop existing overly permissive RLS policies
DROP POLICY IF EXISTS "Allow all reads for pattern notes" ON public.pattern_notes;
DROP POLICY IF EXISTS "Allow all inserts for pattern notes" ON public.pattern_notes;
DROP POLICY IF EXISTS "Allow all updates for pattern notes" ON public.pattern_notes;
DROP POLICY IF EXISTS "Allow all deletes for pattern notes" ON public.pattern_notes;

-- Create new RLS policies that respect privacy and ownership

-- Policy: Users can read their own notes (private and public)
CREATE POLICY "Users can read their own notes"
ON public.pattern_notes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can read other users' public notes
CREATE POLICY "Users can read public notes"
ON public.pattern_notes
FOR SELECT
TO authenticated
USING (is_private = false AND user_id IS NOT NULL);

-- Policy: Users can insert their own notes
CREATE POLICY "Users can insert their own notes"
ON public.pattern_notes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own notes
CREATE POLICY "Users can update their own notes"
ON public.pattern_notes
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own notes
CREATE POLICY "Users can delete their own notes"
ON public.pattern_notes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add an index on user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_pattern_notes_user_id ON public.pattern_notes(user_id);

-- Add an index on is_private for filtering public notes
CREATE INDEX IF NOT EXISTS idx_pattern_notes_is_private ON public.pattern_notes(is_private);

COMMENT ON COLUMN public.pattern_notes.user_id IS 'The user who created this note. Required for all new notes.';
COMMENT ON POLICY "Users can read their own notes" ON public.pattern_notes IS 'Allows users to view all their own notes regardless of privacy setting';
COMMENT ON POLICY "Users can read public notes" ON public.pattern_notes IS 'Allows users to view public notes from other users';
COMMENT ON POLICY "Users can insert their own notes" ON public.pattern_notes IS 'Ensures users can only create notes assigned to themselves';
COMMENT ON POLICY "Users can update their own notes" ON public.pattern_notes IS 'Ensures users can only modify their own notes';
COMMENT ON POLICY "Users can delete their own notes" ON public.pattern_notes IS 'Ensures users can only delete their own notes';