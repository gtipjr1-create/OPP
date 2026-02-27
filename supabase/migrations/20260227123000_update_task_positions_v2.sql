begin;

create or replace function public.update_task_positions_v2(
  p_list_id uuid,
  p_task_ids jsonb
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_list_id is null or p_task_ids is null or jsonb_typeof(p_task_ids) <> 'array' then
    return;
  end if;

  with ordered_input as (
    select
      (task_id_text)::uuid as task_id,
      ordinality
    from jsonb_array_elements_text(p_task_ids) with ordinality as t(task_id_text, ordinality)
  ),
  deduped_order as (
    select
      task_id,
      min(ordinality) as first_ordinality
    from ordered_input
    group by task_id
  ),
  ordered_tasks as (
    select
      task_id,
      row_number() over (order by first_ordinality)::bigint as next_position
    from deduped_order
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
