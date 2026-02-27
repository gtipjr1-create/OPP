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

  with provided_order as (
    select
      (task_id_text)::uuid as task_id,
      min(ordinality) as first_ordinality
    from jsonb_array_elements_text(p_task_ids) with ordinality as t(task_id_text, ordinality)
    group by (task_id_text)::uuid
  ),
  list_tasks as (
    select id as task_id, position
    from public.tasks
    where list_id = p_list_id
  ),
  combined_order as (
    select
      lt.task_id,
      coalesce(po.first_ordinality, 1000000 + row_number() over (order by lt.position, lt.task_id)) as sort_key
    from list_tasks lt
    left join provided_order po on po.task_id = lt.task_id
  ),
  final_order as (
    select
      task_id,
      row_number() over (order by sort_key, task_id)::bigint as next_position
    from combined_order
  ),
  staged as (
    update public.tasks t
    set position = -final_order.next_position
    from final_order
    where t.id = final_order.task_id
      and t.list_id = p_list_id
    returning t.id
  )
  update public.tasks t
  set position = final_order.next_position
  from final_order
  where t.id = final_order.task_id
    and t.list_id = p_list_id;
end;
$$;

commit;
