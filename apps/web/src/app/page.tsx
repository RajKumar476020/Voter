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
      <div className="sticky top-0 z-10 border-b border-line bg-paper/90 backdrop-blur lg:top-0">
        <div className="flex overflow-x-auto">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                'flex-1 whitespace-nowrap px-4 py-3 text-sm',
                tab === item.id ? 'border-b-2 border-vote font-semibold' : 'text-muted',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      {tab === 'following' && !user ? (
        <p className="p-8 text-center text-muted">Sign in to see people you follow.</p>
      ) : (
        <FeedList path={`/api/v1/feed?tab=${tab}`} />
      )}
    </AppShell>
  );
}
