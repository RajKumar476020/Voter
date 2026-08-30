import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes } from 'react';

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-medium transition disabled:opacity-50',
        size === 'sm' && 'h-8 px-3 text-sm',
        size === 'md' && 'h-10 px-4 text-sm',
        size === 'lg' && 'h-12 px-6',
        size === 'icon' && 'h-10 w-10',
        variant === 'primary' && 'bg-vote text-white hover:bg-vote-dark',
        variant === 'ghost' && 'hover:bg-black/5',
        variant === 'outline' && 'border border-line bg-paper-2 hover:bg-white',
        variant === 'danger' && 'bg-ink text-paper hover:opacity-90',
        className,
      )}
      {...props}
    />
  );
}
