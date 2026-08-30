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
        'inline-flex items-center justify-center gap-2 rounded-[11px] font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/20 focus-visible:ring-offset-1',
        size === 'sm' && 'h-8 px-3 text-[13px]',
        size === 'md' && 'h-[42px] px-4 text-[14px]',
        size === 'lg' && 'h-[46px] px-6 text-[15px]',
        size === 'icon' && 'h-10 w-10',
        variant === 'primary' &&
          'bg-brand text-white shadow-sm hover:bg-brand-dark hover:-translate-y-px hover:shadow-md active:translate-y-0',
        variant === 'ghost' && 'text-ink hover:bg-brand-soft hover:text-forest',
        variant === 'outline' &&
          'border border-border bg-surface text-ink hover:bg-surface-soft hover:border-border-strong',
        variant === 'danger' && 'bg-danger text-white hover:bg-[#b93630] shadow-sm',
        className,
      )}
      {...props}
    />
  );
}
