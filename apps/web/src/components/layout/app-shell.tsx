'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Bookmark, Compass, Home, Plus, Search, Settings, Shield, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/api';

const nav = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/create', label: 'Create', icon: Plus, create: true },
  { href: '/notifications', label: 'Alerts', icon: Bell },
  { href: '/saved', label: 'Saved', icon: Bookmark },
];

function BrandMark({ size = 36 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center bg-brand text-white font-semibold"
      style={{ width: size, height: size, borderRadius: 11, fontSize: size * 0.52, letterSpacing: '-0.02em' }}
      aria-hidden
    >
      V
    </span>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <BrandMark size={compact ? 30 : 36} />
      {compact ? null : (
        <span className="text-[19px] font-semibold tracking-tight text-forest" style={{ letterSpacing: '-0.02em' }}>
          Voter
        </span>
      )}
    </Link>
  );
}

export function AppShell({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const router = useRouter();
  const unread = useQuery({
    queryKey: ['notifications'],
    enabled: Boolean(user),
    queryFn: () => client.get<{ unreadCount: number }>('/api/v1/notifications'),
  });
  const unreadCount = unread.data?.unreadCount ?? 0;

  return (
    <div className="mx-auto flex min-h-screen max-w-[1440px]">
      {/* Desktop left rail */}
      <aside className="sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col bg-canvas px-3 py-5 lg:flex xl:w-[236px]">
        <div className="mb-7 px-2">
          <Brand />
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            const isCreate = !!item.create;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-[11px] px-3 py-[9px] text-[14.5px] font-medium transition-colors',
                  isCreate &&
                    'mt-1 bg-brand text-white shadow-sm hover:bg-brand-dark active:translate-y-px',
                  !isCreate && active && 'bg-brand text-white shadow-sm',
                  !isCreate && !active && 'text-ink-soft hover:bg-brand-soft hover:text-forest',
                )}
              >
                <span className="relative flex h-5 w-5 items-center justify-center">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                  {item.href === '/notifications' && unreadCount > 0 ? (
                    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-gold ring-2 ring-canvas" />
                  ) : null}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom utility */}
        {user ? (
          <div className="mt-auto space-y-0 rounded-[18px] border border-border bg-surface p-2 shadow-card">
            {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
              <Link
                href="/admin"
                className="flex items-center gap-3 rounded-[11px] px-3 py-2 text-sm font-medium text-ink-soft hover:bg-surface-soft hover:text-forest"
              >
                <Shield className="h-[18px] w-[18px]" strokeWidth={1.9} /> Admin
              </Link>
            )}
            <Link
              href="/settings"
              className="flex items-center gap-3 rounded-[11px] px-3 py-2 text-sm font-medium text-ink-soft hover:bg-surface-soft hover:text-forest"
            >
              <Settings className="h-[18px] w-[18px]" strokeWidth={1.9} /> Settings
            </Link>
            <Link
              href={`/u/${user.username}`}
              className="mt-1 flex items-center gap-3 rounded-[11px] bg-surface-soft px-3 py-2.5 ring-1 ring-border/60 hover:bg-mist"
            >
              <Avatar name={user.displayName || user.username} src={user.avatarUrl} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold leading-tight text-ink">
                  {user.displayName || user.username}
                </span>
                <span className="block truncate text-xs text-muted">@{user.username}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
            </Link>
          </div>
        ) : (
          <div className="mt-auto rounded-[18px] border border-border bg-surface p-3 shadow-card">
            <p className="text-sm font-medium leading-snug text-ink">Join the conversation</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">Ask a question and let the community decide.</p>
            <Button onClick={() => router.push('/login')} className="mt-3 w-full">
              Sign in
            </Button>
          </div>
        )}
      </aside>

      {/* Center + right */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border/70 bg-canvas/90 px-4 py-3 backdrop-blur-md lg:hidden">
          <Brand compact />
          <div className="flex items-center gap-1.5">
            <Link
              href="/search"
              aria-label="Search"
              className="flex h-9 w-9 items-center justify-center rounded-[11px] border border-border bg-surface text-muted hover:text-ink"
            >
              <Search className="h-[18px] w-[18px]" strokeWidth={1.9} />
            </Link>
            <Link
              href="/notifications"
              aria-label="Notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-[11px] border border-border bg-surface text-muted hover:text-ink"
            >
              <Bell className="h-[18px] w-[18px]" strokeWidth={1.9} />
              {unreadCount > 0 ? <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-brand" /> : null}
            </Link>
          </div>
        </header>

        <div className="flex min-w-0 flex-1 gap-6 px-0 lg:px-6 xl:gap-7 2xl:gap-8">
          <main className="min-w-0 flex-1 pb-28 lg:pb-8">
            <div className="mx-auto w-full max-w-[820px]">{children}</div>
          </main>
          {/* Context rail */}
          <aside className="sticky top-0 hidden h-screen w-[300px] shrink-0 overflow-y-auto py-6 xl:block xl:w-[316px] 2xl:w-[324px]">
            {right ?? <DefaultRail />}
          </aside>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-md lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {[
            { href: '/', icon: Home, label: 'Home' },
            { href: '/explore', icon: Compass, label: 'Explore' },
            { href: '/create', icon: Plus, label: 'Create', accent: true },
            { href: '/saved', icon: Bookmark, label: 'Saved' },
            { href: user ? `/u/${user.username}` : '/login', icon: null, label: 'You' },
          ].map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            const isAccent = !!item.accent;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'flex min-h-[52px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium tracking-tight',
                  isAccent ? 'text-ink' : active ? 'text-brand' : 'text-muted',
                )}
              >
                {isAccent ? (
                  <span className="-mt-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white shadow-[0_8px_20px_rgba(24,166,58,0.28)]">
                    <Plus className="h-5 w-5" strokeWidth={2.2} />
                  </span>
                ) : Icon ? (
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.9} />
                ) : (
                  <Avatar name={user?.displayName || user?.username || 'V'} src={user?.avatarUrl} size="sm" />
                )}
                {isAccent ? <span className="mt-0.5 text-[10px] font-semibold text-muted">Create</span> : item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function DefaultRail() {
  const router = useRouter();
  const trending = useQuery({
    queryKey: ['rail-trending'],
    queryFn: () =>
      client.get<{ items: { id: string; question: string; voteCount: number }[] }>(
        '/api/v1/explore?sort=trending&limit=5',
      ),
  });

  return (
    <div className="space-y-4 pr-1">
      <button
        type="button"
        onClick={() => router.push('/search')}
        className="flex h-11 w-full items-center gap-2.5 rounded-[11px] border border-border bg-surface px-4 text-left text-sm text-muted shadow-sm transition hover:border-border-strong hover:text-ink"
      >
        <Search className="h-[16px] w-[16px]" strokeWidth={1.9} />
        Search polls, people, tags
      </button>

      <div className="rounded-[18px] border border-border bg-surface p-5 shadow-card">
        <p className="text-[17px] font-semibold tracking-tight text-forest" style={{ letterSpacing: '-0.02em' }}>
          Ask. Vote. Decide.
        </p>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">
          Drop a question, give people a real choice, and watch the room make up its mind.
        </p>
      </div>

      <div className="rounded-[18px] border border-border bg-surface p-5 shadow-card">
        <p className="text-sm font-semibold tracking-tight text-ink">Trending</p>
        {(trending.data?.items ?? []).length ? (
          <ul className="mt-3 space-y-3">
            {trending.data!.items.map((poll) => (
              <li key={poll.id}>
                <Link href={`/p/${poll.id}`} className="block rounded-[11px] p-2 -mx-2 hover:bg-surface-soft">
                  <span className="line-clamp-2 text-sm font-medium leading-snug text-ink">{poll.question}</span>
                  <span className="mt-1 block text-xs text-muted">{poll.voteCount} votes</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-muted">Trending polls appear here once the community starts voting.</p>
        )}
      </div>
    </div>
  );
}
