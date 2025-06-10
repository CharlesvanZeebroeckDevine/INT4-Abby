-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can insert their own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Users can view all submissions" ON public.submissions;
DROP POLICY IF EXISTS "Users can update their own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Users can delete their own submissions" ON public.submissions;

-- Create more permissive policies for submissions
CREATE POLICY "Anyone can view submissions" ON public.submissions
  FOR SELECT USING (true);

CREATE POLICY "Service role can insert submissions" ON public.submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can insert their own submissions" ON public.submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own submissions" ON public.submissions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own submissions" ON public.submissions
  FOR DELETE USING (auth.uid() = user_id);

-- Update storage policies to be more permissive
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own artworks" ON storage.objects;

CREATE POLICY "Anyone can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Anyone can upload artworks" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'artworks');

-- Ensure storage buckets are public
UPDATE storage.buckets SET public = true WHERE id IN ('avatars', 'artworks');
