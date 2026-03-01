import * as React from 'react';

type CardTone = 'surface' | 'dark' | 'muted';

type CardProps = {
  tone?: CardTone;
  className?: string;
  children: React.ReactNode;
  as?: React.ElementType;
} & React.HTMLAttributes<HTMLElement>;

const toneClasses: Record<CardTone, string> = {
  surface: 'bg-white/5',
  dark: 'bg-black/30',
  muted: 'bg-black/20',
};

export default function Card({
  tone = 'surface',
  className = '',
  children,
  as,
  ...props
}: CardProps) {
  const Component = as ?? 'div';
  return (
    <Component
      {...props}
      className={['rounded-2xl border border-white/10 p-4', toneClasses[tone], className].filter(Boolean).join(' ')}
    >
      {children}
    </Component>
  );
}
