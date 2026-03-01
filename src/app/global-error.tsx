'use client';

import { useEffect } from 'react';

import { OppMark } from '@/components/OppMark';
import { reportClientError } from '@/lib/telemetry';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportClientError('app.global_error_boundary', error, { digest: error.digest ?? null });
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-dvh bg-black text-text-primary">
        <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
          <OppMark size={32} />
          <h1 className="text-title font-sans uppercase tracking-tight font-bold text-text-primary">
            Something went wrong
          </h1>
          <p className="text-meta font-mono tracking-wide text-text-secondary">
            An unexpected error occurred. Try again.
          </p>
          <button
            type="button"
            onClick={reset}
            className="min-h-[44px] rounded-2xl bg-white px-4 py-2 text-label font-sans uppercase tracking-widest font-semibold text-black"
          >
            Retry
          </button>
        </main>
      </body>
    </html>
  );
}
