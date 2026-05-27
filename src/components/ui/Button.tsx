import * as React from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-accent text-accent-fg shadow-glow-soft hover:shadow-glow hover:brightness-[1.06] active:brightness-95 disabled:opacity-50 disabled:shadow-none',
  secondary:
    'bg-surface-2 text-fg border border-border hover:bg-surface hover:border-border-strong hover:shadow-soft disabled:opacity-50',
  outline:
    'bg-transparent text-fg border border-border hover:border-accent/50 hover:bg-accent/5 hover:text-accent disabled:opacity-50',
  ghost: 'text-fg hover:bg-surface-2 hover:text-fg disabled:opacity-50',
  danger:
    'bg-danger text-white shadow-soft hover:brightness-110 hover:shadow-elevated disabled:opacity-50',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-md',
  md: 'h-9 px-4 text-sm gap-2 rounded-md',
  lg: 'h-11 px-5 text-sm gap-2 rounded-lg',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex select-none items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/25 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
