-- Enable Realtime for tables
-- By default, new tables are not exposed to Realtime. We need to add them to the publication.

-- Add 'profiles' table to the realtime publication
alter publication supabase_realtime add table profiles;

-- Add 'tasks' table to the realtime publication
alter publication supabase_realtime add table tasks;
