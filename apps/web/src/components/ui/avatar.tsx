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
  const dim =
    size === 'sm'
      ? 'h-8 w-8 text-[11px]'
      : size === 'lg'
        ? 'h-[72px] w-[72px] text-xl sm:h-24 sm:w-24 sm:text-2xl'
        : 'h-[38px] w-[38px] text-sm';
  const initial = (name || '?').slice(0, 1).toUpperCase();
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className={cn('rounded-full object-cover bg-mist ring-1 ring-border', dim)} />
    );
  }
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-brand font-semibold text-white',
        dim,
      )}
      aria-hidden
    >
      {initial}
    </span>
  );
}
