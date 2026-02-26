begin;

alter table if exists public.tasks
  add column if not exists position bigint;

with ranked as (
  select
    id,
    row_number() over (
      partition by list_id
      order by created_at asc, id asc
    ) as rn
  from public.tasks
)
update public.tasks t
set position = ranked.rn
from ranked
where t.id = ranked.id
  and t.position is distinct from ranked.rn;

alter table public.tasks
  alter column position set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_list_id_position_key'
      and conrelid = 'public.tasks'::regclass
  ) then
    alter table public.tasks
      add constraint tasks_list_id_position_key
      unique (list_id, position);
  end if;
end
$$;

commit;
