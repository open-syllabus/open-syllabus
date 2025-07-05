-- Step 1: ONLY enable RLS on room_members table
-- This is safe and won't break anything

ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;