-- Remove the non-unique index
drop index if exists public.tasks_list_position_idx;

-- Create UNIQUE index to enforce ordering integrity
create unique index tasks_list_position_idx
on public.tasks (list_id, position);