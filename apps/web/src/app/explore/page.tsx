'use client';

import { AppShell } from '@/components/layout/app-shell';
import { FeedList } from '@/components/feed/feed-list';
import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/api';
import { useState } from 'react';
import { cn } from '@/lib/utils';

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
      <div className="border-b border-line px-4 py-4">
        <h1 className="font-display text-3xl">Explore</h1>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {SORTS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSort(item.id)}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm whitespace-nowrap',
                sort === item.id ? 'bg-ink text-paper' : 'bg-line',
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
            className={cn('rounded-full px-3 py-1 text-sm', !category ? 'bg-vote text-white' : 'bg-paper-2 border border-line')}
          >
            All
          </button>
          {(categories.data ?? []).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.slug)}
              className={cn(
                'rounded-full px-3 py-1 text-sm whitespace-nowrap',
                category === c.slug ? 'bg-vote text-white' : 'bg-paper-2 border border-line',
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <FeedList path={`/api/v1/explore?sort=${sort}${category ? `&category=${category}` : ''}`} />
    </AppShell>
  );
}
