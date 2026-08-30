'use client';

import { AppShell } from '@/components/layout/app-shell';
import { FeedList } from '@/components/feed/feed-list';
import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/api';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/layout/page-header';

const SORTS = [
  { id: 'trending', label: 'Trending' },
  { id: 'popular', label: 'Popular' },
  { id: 'latest', label: 'Latest' },
  { id: 'ending', label: 'Ending soon' },
  { id: 'discussed', label: 'Most discussed' },
];

export default function ExplorePage() {
  const [sort, setSort] = useState('trending');
  const [category, setCategory] = useState('');
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => client.get<{ id: string; slug: string; name: string }[]>('/api/v1/categories'),
  });

  return (
    <AppShell>
      <div className="px-4 pb-2 pt-6 sm:px-0">
        <PageHeader title="Explore" description="Browse what’s trending across the community." />
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {SORTS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSort(item.id)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-semibold transition whitespace-nowrap',
                sort === item.id
                  ? 'bg-forest text-white shadow-sm'
                  : 'bg-surface text-ink ring-1 ring-border hover:bg-surface-soft',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setCategory('')}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition',
              !category ? 'bg-brand text-white shadow-sm' : 'bg-surface text-ink ring-1 ring-border hover:bg-surface-soft',
            )}
          >
            All
          </button>
          {(categories.data ?? []).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.slug)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition',
                category === c.slug ? 'bg-brand text-white shadow-sm' : 'bg-surface text-ink ring-1 ring-border hover:bg-surface-soft',
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <div className="px-4 py-4 sm:px-0">
        <FeedList path={`/api/v1/explore?sort=${sort}${category ? `&category=${category}` : ''}`} />
      </div>
    </AppShell>
  );
}
