begin;

-- Core ownership columns used by app-side inserts
alter table if exists public.lists add column if not exists user_id uuid;
alter table if exists public.tasks add column if not exists user_id uuid;

-- Foreign keys (idempotent)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'lists_user_id_fkey'
      and conrelid = 'public.lists'::regclass
  ) then
    alter table public.lists
      add constraint lists_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_user_id_fkey'
      and conrelid = 'public.tasks'::regclass
  ) then
    alter table public.tasks
      add constraint tasks_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_list_id_fkey'
      and conrelid = 'public.tasks'::regclass
  ) then
    alter table public.tasks
      add constraint tasks_list_id_fkey
      foreign key (list_id) references public.lists(id) on delete cascade;
  end if;
end
$$;

create index if not exists idx_lists_user_id_created_at on public.lists(user_id, created_at desc);
create index if not exists idx_tasks_list_id_created_at on public.tasks(list_id, created_at desc);
create index if not exists idx_tasks_user_id_created_at on public.tasks(user_id, created_at desc);

alter table public.lists enable row level security;
alter table public.tasks enable row level security;

-- lists policies
drop policy if exists lists_select_own on public.lists;
create policy lists_select_own
on public.lists for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists lists_insert_own on public.lists;
create policy lists_insert_own
on public.lists for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists lists_update_own on public.lists;
create policy lists_update_own
on public.lists for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists lists_delete_own on public.lists;
create policy lists_delete_own
on public.lists for delete
to authenticated
using (auth.uid() = user_id);

-- tasks policies (scoped through parent list ownership)
drop policy if exists tasks_select_own_lists on public.tasks;
create policy tasks_select_own_lists
on public.tasks for select
to authenticated
using (
  exists (
    select 1
    from public.lists l
    where l.id = tasks.list_id
      and l.user_id = auth.uid()
  )
);

drop policy if exists tasks_insert_own_lists on public.tasks;
create policy tasks_insert_own_lists
on public.tasks for insert
to authenticated
with check (
  exists (
    select 1
    from public.lists l
    where l.id = tasks.list_id
      and l.user_id = auth.uid()
  )
);

drop policy if exists tasks_update_own_lists on public.tasks;
create policy tasks_update_own_lists
on public.tasks for update
to authenticated
using (
  exists (
    select 1
    from public.lists l
    where l.id = tasks.list_id
      and l.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.lists l
    where l.id = tasks.list_id
      and l.user_id = auth.uid()
  )
);

drop policy if exists tasks_delete_own_lists on public.tasks;
create policy tasks_delete_own_lists
on public.tasks for delete
to authenticated
using (
  exists (
    select 1
    from public.lists l
    where l.id = tasks.list_id
      and l.user_id = auth.uid()
  )
);

commit;