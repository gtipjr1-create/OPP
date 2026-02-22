'use server';

import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabaseServer';

export async function createTaskAction(formData: FormData) {
  const content = String(formData.get('content') ?? formData.get('title') ?? '').trim();
  const listId = String(formData.get('list_id') ?? '').trim();

  if (!content || !listId) {
    return;
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error('[createTaskAction] auth.getUser failed:', error.message);
    throw new Error(error.message);
  }

  if (!user) {
    console.error('[createTaskAction] Auth session missing: no user returned from getUser().');
    redirect('/login');
  }

  const { error: insertError } = await supabase.from('tasks').insert({
    user_id: user.id,
    list_id: listId,
    content,
  });

  if (insertError) {
    throw new Error(insertError.message);
  }
}
