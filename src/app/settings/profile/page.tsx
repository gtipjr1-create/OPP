import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import Card from '@/components/ui/Card';
import SectionHeader from '@/components/ui/SectionHeader';
import { createSupabaseServerClient } from '@/lib/supabase/server';

async function saveProfileAction(formData: FormData) {
  'use server';

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const displayName = String(formData.get('display_name') ?? '').trim();
  const avatarUrl = String(formData.get('avatar_url') ?? '').trim();

  const { error } = await supabase.from('profiles').upsert(
    {
      user_id: user.id,
      display_name: displayName || null,
      avatar_url: avatarUrl || null,
    },
    { onConflict: 'user_id' },
  );

  if (error) {
    redirect(`/settings/profile?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/settings/profile');
  redirect('/settings/profile?saved=1');
}

type ProfilePageProps = {
  searchParams?: {
    saved?: string;
    error?: string;
  };
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('user_id', user.id)
    .maybeSingle();

  const displayName = String(profile?.display_name ?? '');
  const avatarUrl = String(profile?.avatar_url ?? '');
  const saved = searchParams?.saved === '1';
  const error = searchParams?.error;

  return (
    <div className="min-h-dvh bg-black text-text-primary">
      <div className="mx-auto max-w-2xl px-5 pb-8 pt-6">
        <Card className="rounded-3xl">
          <SectionHeader>PROFILE</SectionHeader>

          <form action={saveProfileAction} className="mt-3 space-y-3">
            <div className="space-y-1">
              <label
                htmlFor="display_name"
                className="text-label font-sans uppercase tracking-widest font-semibold text-text-tertiary"
              >
                Display Name
              </label>
              <input
                id="display_name"
                name="display_name"
                defaultValue={displayName}
                placeholder="Your name"
                className="min-h-[44px] w-full rounded-xl border border-white/10 bg-black/20 px-3 text-task font-medium text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--state-active)]"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="avatar_url"
                className="text-label font-sans uppercase tracking-widest font-semibold text-text-tertiary"
              >
                Avatar URL
              </label>
              <input
                id="avatar_url"
                name="avatar_url"
                defaultValue={avatarUrl}
                placeholder="https://..."
                className="min-h-[44px] w-full rounded-xl border border-white/10 bg-black/20 px-3 text-task font-medium text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--state-active)]"
              />
            </div>

            <div className="pt-1">
              <button
                type="submit"
                className="min-h-[40px] rounded-lg border border-[color:var(--state-active)]/30 bg-blue-500/10 px-3 py-1.5 text-label font-sans uppercase tracking-widest font-semibold text-text-accent hover:bg-blue-500/15"
              >
                Save Profile
              </button>
            </div>
          </form>

          {saved ? (
            <div className="mt-3 text-meta font-mono tracking-wide text-[color:var(--state-completed)]">
              Profile saved.
            </div>
          ) : null}

          {error ? (
            <div className="mt-3 text-meta font-mono tracking-wide text-red-200">
              Save failed: {error}
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
