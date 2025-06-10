-- Add contact fields to submissions table
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_name TEXT;

-- Create index for better performance on email lookups
CREATE INDEX IF NOT EXISTS idx_submissions_contact_email ON public.submissions(contact_email);

-- Update RLS policies to work with contact_email
DROP POLICY IF EXISTS "Users can view their own submissions by email" ON public.submissions;
CREATE POLICY "Users can view their own submissions by email" ON public.submissions
  FOR SELECT USING (true);

-- Allow anyone to insert submissions (for prototype)
DROP POLICY IF EXISTS "Anyone can insert submissions" ON public.submissions;
CREATE POLICY "Anyone can insert submissions" ON public.submissions
  FOR INSERT WITH CHECK (true);

-- Allow users to update their own submissions by email
DROP POLICY IF EXISTS "Users can update their own submissions by email" ON public.submissions;
CREATE POLICY "Users can update their own submissions by email" ON public.submissions
  FOR UPDATE USING (true);

-- Allow users to delete their own submissions by email
DROP POLICY IF EXISTS "Users can delete their own submissions by email" ON public.submissions;
CREATE POLICY "Users can delete their own submissions by email" ON public.submissions
  FOR DELETE USING (true);

-- Make user_id nullable since we're not using auth users anymore
ALTER TABLE public.submissions 
ALTER COLUMN user_id DROP NOT NULL;

-- Update the foreign key constraint to be deferrable (optional)
ALTER TABLE public.submissions 
DROP CONSTRAINT IF EXISTS submissions_user_id_fkey;

-- Add a new constraint that allows NULL user_id
ALTER TABLE public.submissions 
ADD CONSTRAINT submissions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) 
ON DELETE SET NULL 
DEFERRABLE INITIALLY DEFERRED;
