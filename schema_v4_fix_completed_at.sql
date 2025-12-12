-- Add completed_at column to tasks table
alter table tasks add column if not exists completed_at timestamp with time zone;

-- Create function to handle task completion
create or replace function handle_task_completion()
returns trigger as $$
begin
    if new.status = 'done' and old.status != 'done' then
        new.completed_at = now();
    elsif new.status != 'done' then
        new.completed_at = null;
    end if;
    return new;
end;
$$ language plpgsql;

-- Create trigger for task completion
drop trigger if exists on_task_completion on tasks;
create trigger on_task_completion
    before update on tasks
    for each row
    execute function handle_task_completion();
