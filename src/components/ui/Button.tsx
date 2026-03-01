import * as React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = {
  variant?: ButtonVariant;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-white text-black border border-white/10 hover:opacity-90 disabled:bg-white/20 disabled:text-text-tertiary disabled:border-white/10',
  secondary:
    'bg-transparent border border-white/20 text-text-secondary hover:bg-white/5 hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed',
  ghost:
    'bg-transparent border border-transparent text-text-tertiary hover:bg-white/5 hover:text-text-secondary disabled:opacity-40 disabled:cursor-not-allowed',
  danger:
    'bg-red-500/20 border border-red-400/30 text-red-200 hover:bg-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed',
};

export default function Button({
  variant = 'primary',
  onClick,
  disabled = false,
  children,
  className = '',
}: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'min-h-[44px] rounded-2xl px-4 py-3 text-label font-sans uppercase tracking-widest font-semibold transition-colors',
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  );
}
