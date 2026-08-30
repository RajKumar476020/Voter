'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Bookmark, Compass, Home, PenLine, Search, Settings, Shield } from 'lucide-react';
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
  { href: '/create', label: 'Create', icon: PenLine, accent: true },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/saved', label: 'Saved', icon: Bookmark },
];

export function AppShell({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const router = useRouter();
  const unread = useQuery({
    queryKey: ['notifications'],
    enabled: Boolean(user),
    queryFn: () => client.get<{ unreadCount: number }>('/api/v1/notifications'),
  });

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-line px-4 py-6 lg:flex">
        <Link href="/" className="mb-8 px-2 font-display text-3xl tracking-tight">
          Voter
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-full px-3 py-2.5 text-[15px]',
                  item.accent && 'bg-vote text-white hover:bg-vote-dark',
                  !item.accent && active && 'bg-ink text-paper',
                  !item.accent && !active && 'hover:bg-black/5',
                )}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {item.href === '/notifications' && (unread.data?.unreadCount ?? 0) > 0 ? (
                    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-vote" />
                  ) : null}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        {user ? (
          <div className="space-y-2">
            {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
              <Link href="/admin" className="flex items-center gap-3 rounded-full px-3 py-2 hover:bg-black/5">
                <Shield className="h-5 w-5" /> Admin
              </Link>
            )}
            <Link href="/settings" className="flex items-center gap-3 rounded-full px-3 py-2 hover:bg-black/5">
              <Settings className="h-5 w-5" /> Settings
            </Link>
            <Link href={`/u/${user.username}`} className="flex items-center gap-3 rounded-full px-3 py-2 hover:bg-black/5">
              <Avatar name={user.displayName || user.username} src={user.avatarUrl} size="sm" />
              <span className="truncate">
                <span className="block text-sm font-medium">{user.displayName}</span>
                <span className="block text-xs text-muted">@{user.username}</span>
              </span>
            </Link>
          </div>
        ) : (
          <Button onClick={() => router.push('/login')} className="w-full">
            Sign in
          </Button>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-paper/85 px-4 py-3 backdrop-blur lg:hidden">
          <Link href="/" className="font-display text-2xl">
            Voter
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/search" aria-label="Search" className="rounded-full p-2 hover:bg-black/5">
              <Search className="h-5 w-5" />
            </Link>
            <Link href="/notifications" aria-label="Notifications" className="relative rounded-full p-2 hover:bg-black/5">
              <Bell className="h-5 w-5" />
            </Link>
          </div>
        </header>
        <div className="flex min-w-0 flex-1">
          <main className="min-w-0 flex-1 pb-24 lg:pb-8">{children}</main>
          <aside className="sticky top-0 hidden h-screen w-80 shrink-0 overflow-y-auto border-l border-line p-5 xl:block">
            {right ?? <DefaultRail />}
          </aside>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-paper/95 px-2 py-2 backdrop-blur lg:hidden">
        {[
          { href: '/', icon: Home, label: 'Home' },
          { href: '/explore', icon: Compass, label: 'Explore' },
          { href: '/create', icon: PenLine, label: 'Create', accent: true },
          { href: '/notifications', icon: Bell, label: 'Notifications' },
          { href: user ? `/u/${user.username}` : '/login', icon: null, label: 'Profile' },
        ].map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn('flex flex-col items-center justify-center gap-1 text-[11px]', active && 'text-vote')}
            >
              {item.accent ? (
                <span className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-vote text-white shadow-lg">
                  <PenLine className="h-5 w-5" />
                </span>
              ) : Icon ? (
                <Icon className="h-5 w-5" />
              ) : (
                <Avatar name={user?.displayName || user?.username || 'V'} src={user?.avatarUrl} size="sm" />
              )}
              {item.accent ? null : item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function DefaultRail() {
  const router = useRouter();
  const trending = useQuery({
    queryKey: ['rail-trending'],
    queryFn: () => client.get<{ items: { id: string; question: string; voteCount: number }[] }>('/api/v1/explore?sort=trending&limit=5'),
  });

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => router.push('/search')}
        className="flex h-11 w-full items-center gap-2 rounded-full border border-line bg-paper-2 px-4 text-left text-muted"
      >
        <Search className="h-4 w-4" /> Search polls, people, tags
      </button>
      <div className="rounded-3xl border border-line bg-paper-2 p-4">
        <p className="font-display text-xl">Ask. Vote. Decide.</p>
        <p className="mt-2 text-sm text-muted">
          Drop a question, give people a real choice, and watch the room make up its mind.
        </p>
      </div>
      {(trending.data?.items ?? []).length ? (
        <div className="rounded-3xl border border-line p-4">
          <p className="font-display text-xl">Trending</p>
          <ul className="mt-3 space-y-3">
            {trending.data!.items.map((poll) => (
              <li key={poll.id}>
                <Link href={`/p/${poll.id}`} className="block hover:underline">
                  <span className="text-sm font-medium">{poll.question}</span>
                  <span className="mt-0.5 block text-xs text-muted">{poll.voteCount} votes</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
