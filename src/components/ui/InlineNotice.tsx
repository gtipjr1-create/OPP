import * as React from 'react';

type InlineNoticeVariant = 'error' | 'success' | 'info';

type InlineNoticeProps = {
  variant?: InlineNoticeVariant;
  className?: string;
  children: React.ReactNode;
};

const variantClasses: Record<InlineNoticeVariant, string> = {
  error: 'border-red-400/45 bg-red-500/15 text-red-100',
  success: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100',
  info: 'border-white/15 bg-white/5 text-text-secondary',
};

export default function InlineNotice({ variant = 'info', className = '', children }: InlineNoticeProps) {
  return (
    <div
      className={[
        'rounded-2xl border p-4 text-meta font-mono tracking-wide',
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
