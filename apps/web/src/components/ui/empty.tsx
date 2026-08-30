import { Button } from './button';

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="rounded-[18px] border border-border bg-surface px-6 py-14 text-center shadow-card sm:px-8 sm:py-16">
      {/* organic dot accent */}
      <div className="mx-auto mb-3 h-1.5 w-8 rounded-full bg-brand/20" aria-hidden />
      <p className="text-[20px] font-semibold tracking-tight text-ink sm:text-[22px]">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted sm:text-[15px]">{body}</p>
      {action ? (
        <Button className="mt-6" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-[18px] bg-border/70 ${className ?? 'h-24'}`} />;
}
