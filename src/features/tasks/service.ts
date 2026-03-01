import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import type { ListRow, TaskRow } from './types';
import { parseTaskSemantics } from './lib/taskSemantics';

const supabase = createSupabaseBrowserClient();

function assertNoError(error: { message: string } | null): void {
  if (error) {
    throw new Error(error.message);
  }
}

function isMissingSemanticsColumnsError(error: { message: string } | null): boolean {
  if (!error) {
    return false;
  }
  const message = error.message.toLowerCase();
  return (
    message.includes('column') &&
    (message.includes('priority') || message.includes('tagged_priority') || message.includes('scheduled_time') || message.includes('scheduled_for')) &&
    message.includes('does not exist')
  );
}

async function getRequiredUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  if (!user) {
    throw new Error('Not authenticated. Sign in before creating a session.');
  }

  return user.id;
}

export function formatDefaultListTitle(date = new Date()): string {
  return date
    .toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'numeric',
      day: 'numeric',
      year: '2-digit',
    })
    .toUpperCase()
    .replace(',', ':');
}

export async function listLists(): Promise<ListRow[]> {
  const { data, error } = await supabase
    .from('lists')
    .select('*')
    .order('created_at', { ascending: false });

  assertNoError(error);
  return (data ?? []) as ListRow[];
}

export async function listTasks(listId: string): Promise<TaskRow[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('list_id', listId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });

  assertNoError(error);
  return (data ?? []) as TaskRow[];
}

export async function listTasksForLists(listIds: string[]): Promise<TaskRow[]> {
  if (listIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .in('list_id', listIds)
    .order('created_at', { ascending: false });

  assertNoError(error);
  return (data ?? []) as TaskRow[];
}

export async function createList(title: string): Promise<ListRow> {
  const userId = await getRequiredUserId();

  const { data, error } = await supabase
    .from('lists')
    .insert([{ title, user_id: userId }])
    .select()
    .single();

  assertNoError(error);
  return data as ListRow;
}

export async function createTask(listId: string, content: string): Promise<TaskRow> {
  const userId = await getRequiredUserId();
  const { data: highestPositionTask, error: positionError } = await supabase
    .from('tasks')
    .select('position')
    .eq('list_id', listId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();

  assertNoError(positionError);
  const nextPosition = Number(highestPositionTask?.position ?? 0) + 1;
  const semantics = parseTaskSemantics(content, 'normal');

  let { data, error } = await supabase
    .from('tasks')
    .insert([{
      content,
      list_id: listId,
      user_id: userId,
      position: nextPosition,
      priority: semantics.priority,
      tagged_priority: semantics.taggedPriority ?? null,
      scheduled_time: semantics.scheduledTime ?? null,
      scheduled_for: semantics.scheduledFor ?? null,
    }])
    .select()
    .single();

  if (isMissingSemanticsColumnsError(error)) {
    const fallback = await supabase
      .from('tasks')
      .insert([{ content, list_id: listId, user_id: userId, position: nextPosition }])
      .select()
      .single();
    data = fallback.data;
    error = fallback.error;
  }

  assertNoError(error);
  return data as TaskRow;
}

export async function setTaskDone(taskId: string, isDone: boolean): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ is_done: isDone })
    .eq('id', taskId);

  assertNoError(error);
}

export async function renameTask(taskId: string, content: string): Promise<void> {
  const semantics = parseTaskSemantics(content, 'normal');
  let { error } = await supabase
    .from('tasks')
    .update({
      content,
      tagged_priority: semantics.taggedPriority ?? null,
      scheduled_time: semantics.scheduledTime ?? null,
      scheduled_for: semantics.scheduledFor ?? null,
      ...(semantics.taggedPriority ? { priority: semantics.taggedPriority } : {}),
    })
    .eq('id', taskId);

  if (isMissingSemanticsColumnsError(error)) {
    const fallback = await supabase
      .from('tasks')
      .update({ content })
      .eq('id', taskId);
    error = fallback.error;
  }

  assertNoError(error);
}

export async function removeTask(taskId: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  assertNoError(error);
}

export async function renameList(listId: string, title: string): Promise<void> {
  const { error } = await supabase
    .from('lists')
    .update({ title })
    .eq('id', listId);

  assertNoError(error);
}

export async function removeList(listId: string): Promise<void> {
  const { error } = await supabase.from('lists').delete().eq('id', listId);
  assertNoError(error);
}
