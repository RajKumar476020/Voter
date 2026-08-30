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
    <div className="rounded-3xl border border-dashed border-line bg-paper-2/70 px-6 py-14 text-center">
      <p className="font-display text-2xl">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-muted">{body}</p>
      {action ? (
        <Button className="mt-5" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-line/70 ${className ?? 'h-24'}`} />;
}
