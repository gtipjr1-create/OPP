begin;

alter table if exists public.tasks
  add column if not exists priority text,
  add column if not exists tagged_priority text,
  add column if not exists scheduled_time time,
  add column if not exists scheduled_for date;

update public.tasks
set priority = 'normal'
where priority is null;

alter table public.tasks
  alter column priority set default 'normal';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_priority_check'
      and conrelid = 'public.tasks'::regclass
  ) then
    alter table public.tasks
      add constraint tasks_priority_check
      check (priority in ('high', 'normal', 'low'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_tagged_priority_check'
      and conrelid = 'public.tasks'::regclass
  ) then
    alter table public.tasks
      add constraint tasks_tagged_priority_check
      check (tagged_priority is null or tagged_priority in ('high', 'normal', 'low'));
  end if;
end
$$;

create index if not exists idx_tasks_list_id_scheduled_time on public.tasks(list_id, scheduled_time);
create index if not exists idx_tasks_list_id_priority on public.tasks(list_id, priority);

commit;
