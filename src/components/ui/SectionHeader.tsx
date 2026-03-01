import * as React from 'react';

type SectionHeaderProps = React.HTMLAttributes<HTMLDivElement>;

export default function SectionHeader({ className = '', children, ...props }: SectionHeaderProps) {
  return (
    <div
      {...props}
      className={[
        'text-label font-sans uppercase tracking-widest font-semibold text-text-tertiary',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
