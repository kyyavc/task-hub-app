-- Add date fields to tasks
alter table tasks 
add column if not exists start_date timestamptz,
add column if not exists due_date timestamptz;
