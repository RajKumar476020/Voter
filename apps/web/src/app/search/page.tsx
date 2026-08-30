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
      <div className="border-b border-line px-4 py-4">
        <h1 className="font-display text-3xl">Search</h1>
        <div className="mt-3">
          <Field label="Search">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="iPhone, design, @rahul" />
          </Field>
        </div>
        <div className="mt-3 flex gap-2">
          {TABS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={cn('rounded-full px-3 py-1.5 text-sm', tab === item ? 'bg-ink text-paper' : 'bg-line')}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      {!q.trim() ? <p className="p-6 text-muted">Search polls, people, and tags.</p> : null}
      {tab === 'Polls'
        ? (results.data?.polls ?? []).map((poll) => <PollCard key={poll.id} poll={poll} compact />)
        : null}
      {tab === 'Users' ? (
        <ul className="divide-y divide-line">
          {(results.data?.users ?? []).map((person) => (
            <li key={person.id} className="px-4 py-3">
              <Link href={`/u/${person.username}`} className="flex items-center gap-3">
                <Avatar name={person.displayName || person.username} src={person.avatarUrl} />
                <span>
                  <span className="block font-medium">{person.displayName || person.username}</span>
                  <span className="text-sm text-muted">@{person.username}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {tab === 'Tags' ? (
        <div className="flex flex-wrap gap-2 p-4">
          {(results.data?.tags ?? []).map((tag) => (
            <Link key={tag.slug} href={`/search?q=${tag.slug}`} className="rounded-full bg-line px-3 py-1 text-sm">
              #{tag.name}
            </Link>
          ))}
          {(results.data?.categories ?? []).map((c) => (
            <Link key={c.slug} href={`/explore`} className="rounded-full border border-line px-3 py-1 text-sm">
              {c.name}
            </Link>
          ))}
        </div>
      ) : null}
    </AppShell>
  );
}
