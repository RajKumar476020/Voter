'use client';

import { AppShell } from '@/components/layout/app-shell';
import { FeedList } from '@/components/feed/feed-list';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';

const TABS = [
  { id: 'for-you', label: 'For You' },
  { id: 'following', label: 'Following' },
  { id: 'trending', label: 'Trending' },
  { id: 'latest', label: 'Latest' },
];

export default function HomePage() {
  const [tab, setTab] = useState('for-you');
  const { user } = useAuth();

  return (
    <AppShell>
      <div className="sticky top-[57px] z-10 border-b border-border/60 bg-canvas/90 px-4 pt-3 backdrop-blur-md lg:top-0 lg:px-0">
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-semibold transition',
                tab === item.id
                  ? 'bg-forest text-white shadow-sm'
                  : 'bg-surface text-ink-soft ring-1 ring-border hover:bg-surface-soft hover:text-ink',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="px-4 py-4 sm:px-0">
        {tab === 'following' && !user ? (
          <div className="rounded-[18px] border border-border bg-surface p-10 text-center shadow-card">
            <p className="text-[18px] font-semibold tracking-tight text-ink">Follow people to see more</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">Sign in to see polls from people you follow.</p>
          </div>
        ) : (
          <FeedList path={`/api/v1/feed?tab=${tab}`} />
        )}
      </div>
    </AppShell>
  );
}
