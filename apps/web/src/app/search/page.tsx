'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { client } from '@/lib/api';
import { PollCard as Poll, UserPreview } from '@/lib/types';
import { PollCard } from '@/components/poll/poll-card';
import { Avatar } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { Field, Input } from '@/components/ui/field';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/layout/page-header';

const TABS = ['Polls', 'Users', 'Tags'] as const;

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<(typeof TABS)[number]>('Polls');
  const results = useQuery({
    queryKey: ['search', q],
    enabled: q.trim().length > 0,
    queryFn: () =>
      client.get<{
        polls: Poll[];
        users: UserPreview[];
        tags: { slug: string; name: string }[];
        categories: { slug: string; name: string }[];
      }>(`/api/v1/search?q=${encodeURIComponent(q)}`),
  });

  return (
    <AppShell>
      <div className="px-4 pb-2 pt-6 sm:px-0">
        <PageHeader title="Search" description="Find polls, people, and tags." />
        <div className="mt-5">
          <Field label="Search">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="iPhone, design, @rahul"
              className="h-[46px] rounded-[12px]"
            />
          </Field>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto">
          {TABS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-semibold transition',
                tab === item ? 'bg-forest text-white shadow-sm' : 'bg-surface text-ink ring-1 ring-border hover:bg-surface-soft',
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      {!q.trim() ? (
        <p className="px-4 pt-6 text-sm leading-relaxed text-muted sm:px-0">Start typing to search polls, people, and tags.</p>
      ) : null}
      {q.trim() && tab === 'Polls' ? (
        <div className="space-y-4 px-4 py-4 sm:px-0">
          {(results.data?.polls ?? []).length ? (
            results.data!.polls.map((poll) => <PollCard key={poll.id} poll={poll} compact />)
          ) : (
            <p className="rounded-[14px] border border-dashed border-border bg-surface-soft px-4 py-8 text-center text-sm text-muted">
              No polls match “{q}”.
            </p>
          )}
        </div>
      ) : null}
      {tab === 'Users' && q.trim() ? (
        <ul className="space-y-2 px-4 py-4 sm:px-0">
          {(results.data?.users ?? []).map((person) => (
            <li key={person.id} className="rounded-[18px] border border-border bg-surface p-4 shadow-card">
              <Link href={`/u/${person.username}`} className="flex items-center gap-3">
                <Avatar name={person.displayName || person.username} src={person.avatarUrl} />
                <span>
                  <span className="block text-sm font-semibold text-ink">{person.displayName || person.username}</span>
                  <span className="text-sm text-muted">@{person.username}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {tab === 'Tags' && q.trim() ? (
        <div className="flex flex-wrap gap-2 px-4 py-4 sm:px-0">
          {(results.data?.tags ?? []).map((tag) => (
            <Link key={tag.slug} href={`/search?q=${tag.slug}`} className="rounded-full bg-surface px-4 py-2 text-sm font-medium ring-1 ring-border hover:bg-surface-soft">
              #{tag.name}
            </Link>
          ))}
          {(results.data?.categories ?? []).map((c) => (
            <Link key={c.slug} href={`/explore`} className="rounded-full bg-surface px-4 py-2 text-sm font-medium ring-1 ring-border hover:bg-surface-soft">
              {c.name}
            </Link>
          ))}
        </div>
      ) : null}
    </AppShell>
  );
}
