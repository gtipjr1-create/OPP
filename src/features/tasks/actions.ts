'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { reportServerError } from '@/lib/telemetry';
import { parseTaskSemantics } from './lib/taskSemantics';

function isMissingSemanticsColumnsError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const message = String((error as { message?: string }).message ?? '').toLowerCase();
  return (
    message.includes('column') &&
    (message.includes('priority') || message.includes('tagged_priority') || message.includes('scheduled_time') || message.includes('scheduled_for')) &&
    message.includes('does not exist')
  );
}

export async function whoAmI() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return {
    hasUser: !!user,
    userId: user?.id ?? null,
    error: error?.message ?? null,
  };
}

export async function createTaskAction(formData: FormData) {
  const content = String(formData.get('content') ?? formData.get('title') ?? '').trim();
  const listId = String(formData.get('list_id') ?? '').trim();
  const requestedPriorityRaw = String(formData.get('priority') ?? '').trim().toLowerCase();
  const requestedPriority =
    requestedPriorityRaw === 'high' || requestedPriorityRaw === 'normal' || requestedPriorityRaw === 'low'
      ? requestedPriorityRaw
      : 'normal';

  if (!content || !listId) {
    return;
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    reportServerError('tasks.create.auth_get_user_failed', error, { listId });
    throw new Error(error.message);
  }

  if (!user) {
    reportServerError('tasks.create.auth_missing_user', new Error('No user returned from getUser()'), { listId });
    redirect('/login');
  }

  const { data: highestPositionTask, error: positionError } = await supabase
    .from('tasks')
    .select('position')
    .eq('list_id', listId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (positionError) {
    reportServerError('tasks.create.position_lookup_failed', positionError, { listId, userId: user.id });
    throw new Error(positionError.message);
  }

  const nextPosition = Number(highestPositionTask?.position ?? 0) + 1;
  const semantics = parseTaskSemantics(content, requestedPriority);

  const { error: insertError } = await supabase.from('tasks').insert({
    user_id: user.id,
    list_id: listId,
    content,
    position: nextPosition,
    priority: semantics.priority,
    tagged_priority: semantics.taggedPriority ?? null,
    scheduled_time: semantics.scheduledTime ?? null,
    scheduled_for: semantics.scheduledFor ?? null,
  });

  if (insertError) {
    if (isMissingSemanticsColumnsError(insertError)) {
      const { error: legacyInsertError } = await supabase.from('tasks').insert({
        user_id: user.id,
        list_id: listId,
        content,
        position: nextPosition,
      });
      if (!legacyInsertError) {
        revalidatePath('/');
        return;
      }
      reportServerError('tasks.create.legacy_insert_failed', legacyInsertError, { listId, userId: user.id });
      throw new Error(legacyInsertError.message);
    }
    reportServerError('tasks.create.insert_failed', insertError, { listId, userId: user.id });
    throw new Error(insertError.message);
  }

  revalidatePath('/');
}

export async function reorderTaskPositionsAction(listId: string, orderedTaskIds: string[]) {
  const normalizedListId = listId.trim();
  const dedupedOrderedTaskIds = Array.from(
    new Set(orderedTaskIds.map((id) => id.trim()).filter((id) => id.length > 0)),
  );

  if (!normalizedListId || dedupedOrderedTaskIds.length === 0) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    reportServerError('tasks.reorder.auth_get_user_failed', authError, { listId: normalizedListId });
    throw new Error(authError.message);
  }

  if (!user) {
    redirect('/login');
  }

  const { data: currentTasks, error: listTasksError } = await supabase
    .from('tasks')
    .select('id')
    .eq('list_id', normalizedListId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });

  if (listTasksError) {
    reportServerError('tasks.reorder.list_fetch_failed', listTasksError, { listId: normalizedListId, userId: user.id });
    throw new Error(listTasksError.message);
  }

  const existingIds = (currentTasks ?? []).map((task) => task.id);
  if (existingIds.length === 0) {
    return;
  }

  const existingIdSet = new Set(existingIds);
  const knownOrderedIds = dedupedOrderedTaskIds.filter((id) => existingIdSet.has(id));
  const missingIds = existingIds.filter((id) => !knownOrderedIds.includes(id));
  const fullOrder = [...knownOrderedIds, ...missingIds];

  const { error: reorderError } = await supabase.rpc('update_task_positions', {
    p_list_id: normalizedListId,
    p_task_ids: fullOrder,
  });

  if (reorderError) {
    reportServerError('tasks.reorder.rpc_failed', reorderError, { listId: normalizedListId, userId: user.id });
    throw new Error(reorderError.message);
  }

  revalidatePath('/');
}

export async function deleteTaskAction(taskId: string) {
  const id = String(taskId ?? '').trim();
  if (!id) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    reportServerError('tasks.delete.auth_get_user_failed', error, { taskId: id });
    throw new Error(error.message);
  }

  if (!user) {
    reportServerError('tasks.delete.auth_missing_user', new Error('No user returned from getUser()'), { taskId: id });
    redirect('/login');
  }

  const { data: existing, error: fetchError } = await supabase
    .from('tasks')
    .select('id, list_id')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    reportServerError('tasks.delete.lookup_failed', fetchError, { taskId: id, userId: user.id });
    throw new Error(fetchError.message);
  }

  if (!existing) {
    revalidatePath('/');
    return;
  }

  const { error: deleteError } = await supabase.from('tasks').delete().eq('id', id);
  if (deleteError) {
    reportServerError('tasks.delete.delete_failed', deleteError, { taskId: id, userId: user.id });
    throw new Error(deleteError.message);
  }

  const { data: remaining, error: remainingError } = await supabase
    .from('tasks')
    .select('id')
    .eq('list_id', existing.list_id)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });

  if (remainingError) {
    reportServerError('tasks.delete.remaining_fetch_failed', remainingError, {
      taskId: id,
      listId: existing.list_id,
      userId: user.id,
    });
    throw new Error(remainingError.message);
  }

  const orderedIds = (remaining ?? []).map((task) => task.id);

  const { error: reorderError } = await supabase.rpc('update_task_positions', {
    p_list_id: existing.list_id,
    p_task_ids: orderedIds,
  });

  if (reorderError) {
    reportServerError('tasks.delete.reorder_failed', reorderError, {
      taskId: id,
      listId: existing.list_id,
      userId: user.id,
    });
    throw new Error(reorderError.message);
  }

  revalidatePath('/');
}
