begin;

create or replace function public.update_task_positions(
  p_list_id uuid,
  p_task_ids text[]
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_list_id is null or p_task_ids is null or array_length(p_task_ids, 1) is null then
    return;
  end if;

  with ordered_tasks as (
    select
      (task_id_text)::uuid as task_id,
      row_number() over ()::bigint as next_position
    from unnest(p_task_ids) as task_id_text
  ),
  staged as (
    update public.tasks t
    set position = -ordered_tasks.next_position
    from ordered_tasks
    where t.id = ordered_tasks.task_id
      and t.list_id = p_list_id
    returning t.id
  )
  update public.tasks t
  set position = ordered_tasks.next_position
  from ordered_tasks
  where t.id = ordered_tasks.task_id
    and t.list_id = p_list_id;
end;
$$;

commit;
