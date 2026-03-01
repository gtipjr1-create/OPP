'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabaseServer';
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
  console.log('SERVER getUser:', { hasUser: !!user, error: error?.message });

  if (error) {
    console.error('[createTaskAction] auth.getUser failed:', error.message);
    throw new Error(error.message);
  }

  if (!user) {
    console.error('[createTaskAction] Auth session missing: no user returned from getUser().');
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
      throw new Error(legacyInsertError.message);
    }
    console.error('[createTaskAction] insert failed:', {
      message: insertError.message,
      details: (insertError as { details?: string }).details,
      hint: (insertError as { hint?: string }).hint,
      code: (insertError as { code?: string }).code,
      listId,
      userId: user.id,
    });
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
    console.error('[RPC] update_task_positions failed', reorderError);
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
    console.error('[deleteTaskAction] auth.getUser failed:', error.message);
    throw new Error(error.message);
  }

  if (!user) {
    console.error('[deleteTaskAction] Auth session missing: no user returned from getUser().');
    redirect('/login');
  }

  const { data: existing, error: fetchError } = await supabase
    .from('tasks')
    .select('id, list_id')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (!existing) {
    revalidatePath('/');
    return;
  }

  const { error: deleteError } = await supabase.from('tasks').delete().eq('id', id);
  if (deleteError) {
    console.error('[deleteTaskAction] delete failed:', deleteError.message);
    throw new Error(deleteError.message);
  }

  const { data: remaining, error: remainingError } = await supabase
    .from('tasks')
    .select('id')
    .eq('list_id', existing.list_id)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });

  if (remainingError) {
    throw new Error(remainingError.message);
  }

  const orderedIds = (remaining ?? []).map((task) => task.id);

  const { error: reorderError } = await supabase.rpc('update_task_positions', {
    p_list_id: existing.list_id,
    p_task_ids: orderedIds,
  });

  if (reorderError) {
    console.error('[deleteTaskAction] update_task_positions failed:', reorderError);
    throw new Error(reorderError.message);
  }

  revalidatePath('/');
}
