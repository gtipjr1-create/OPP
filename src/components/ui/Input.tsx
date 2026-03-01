import * as React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input({ className = '', ...props }, ref) {
  return (
    <input
      ref={ref}
      {...props}
      className={[
        'w-full bg-transparent text-task outline-none placeholder:text-text-tertiary',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
});

export default Input;
