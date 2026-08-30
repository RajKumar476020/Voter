import { cn } from '@/lib/utils';

export function Avatar({
  name,
  src,
  size = 'md',
}: {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  const dim = size === 'sm' ? 'h-8 w-8 text-xs' : size === 'lg' ? 'h-20 w-20 text-2xl' : 'h-10 w-10 text-sm';
  const initial = (name || '?').slice(0, 1).toUpperCase();
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className={cn('rounded-full object-cover bg-line', dim)} />
    );
  }
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-ink text-paper font-semibold',
        dim,
      )}
      aria-hidden
    >
      {initial}
    </span>
  );
}
