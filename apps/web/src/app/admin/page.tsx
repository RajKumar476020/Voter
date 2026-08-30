'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { RequireAuth } from '@/components/auth/require-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/field';
import { client } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

type Dash = {
  totalUsers: number;
  activeUsers: number;
  totalPolls: number;
  totalVotes: number;
  totalComments: number;
  reports: number;
  newUsers: number;
  pollActivity: number;
};

type AdminUser = {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  role: string;
  status: string;
  createdAt: string;
};

type AdminPoll = {
  id: string;
  question: string;
  status: string;
  createdAt: string;
  author: { username: string; displayName: string | null };
};

type AdminComment = {
  id: string;
  content: string;
  user: { username: string };
  poll: { id: string; question: string };
};

type AdminReport = {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  description: string | null;
  status: string;
  reporter: { username: string };
};

const TABS = ['Dashboard', 'Users', 'Polls', 'Comments', 'Reports'] as const;

export default function AdminPage() {
  return (
    <AppShell>
      <RequireAuth admin>
        <AdminHome />
      </RequireAuth>
    </AppShell>
  );
}

function AdminHome() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Dashboard');
  return (
    <div className="px-4 pt-6 sm:px-0">
      <h1 className="text-[26px] font-semibold tracking-tight text-forest sm:text-[30px]" style={{ letterSpacing: '-0.025em' }}>
        Admin
      </h1>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
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
      <div className="mt-6">
        {tab === 'Dashboard' ? <Dashboard /> : null}
        {tab === 'Users' ? <Users /> : null}
        {tab === 'Polls' ? <Polls /> : null}
        {tab === 'Comments' ? <Comments /> : null}
        {tab === 'Reports' ? <Reports /> : null}
      </div>
    </div>
  );
}

function Dashboard() {
  const dash = useQuery({
    queryKey: ['admin-dash'],
    queryFn: () => client.get<Dash>('/api/v1/admin/dashboard'),
  });
  const d = dash.data;
  const cards = d
    ? [
        ['Users', d.totalUsers],
        ['Active sessions', d.activeUsers],
        ['Polls', d.totalPolls],
        ['Votes', d.totalVotes],
        ['Comments', d.totalComments],
        ['Pending reports', d.reports],
        ['New users (24h)', d.newUsers],
        ['Polls this week', d.pollActivity],
      ]
    : [];
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(([label, value]) => (
        <div key={label} className="rounded-[18px] border border-border bg-surface p-5 shadow-card">
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-ink" style={{ letterSpacing: '-0.02em' }}>
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}

function Users() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const users = useQuery({
    queryKey: ['admin-users', q],
    queryFn: () => client.get<AdminUser[]>(`/api/v1/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  });
  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => client.patch(`/api/v1/admin/users/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });
  return (
    <div>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users" />
      <ul className="mt-4 divide-y divide-border overflow-hidden rounded-[18px] border border-border bg-surface shadow-card">
        {(users.data ?? []).map((u) => (
          <li key={u.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">
                {u.displayName || u.username} <span className="font-normal text-muted">@{u.username}</span>
              </p>
              <p className="text-xs text-muted">
                {u.email} · {u.status} · {u.role}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: u.id, status: 'SUSPENDED' })}>
                Suspend
              </Button>
              <Button size="sm" variant="danger" onClick={() => setStatus.mutate({ id: u.id, status: 'BANNED' })}>
                Ban
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setStatus.mutate({ id: u.id, status: 'ACTIVE' })}>
                Restore
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Polls() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const polls = useQuery({
    queryKey: ['admin-polls', q],
    queryFn: () => client.get<AdminPoll[]>(`/api/v1/admin/polls${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  });
  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => client.patch(`/api/v1/admin/polls/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-polls'] }),
  });
  return (
    <div>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search polls" />
      <ul className="mt-4 divide-y divide-border overflow-hidden rounded-[18px] border border-border bg-surface shadow-card">
        {(polls.data ?? []).map((p) => (
          <li key={p.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div>
              <a className="text-sm font-semibold text-ink hover:text-brand hover:underline" href={`/p/${p.id}`}>
                {p.question}
              </a>
              <p className="text-xs text-muted">
                @{p.author.username} · {p.status}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="danger" onClick={() => setStatus.mutate({ id: p.id, status: 'REMOVED' })}>
                Remove
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setStatus.mutate({ id: p.id, status: 'ACTIVE' })}>
                Restore
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Comments() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const comments = useQuery({
    queryKey: ['admin-comments', q],
    queryFn: () => client.get<AdminComment[]>(`/api/v1/admin/comments${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  });
  const remove = useMutation({
    mutationFn: (id: string) => client.patch(`/api/v1/admin/comments/${id}/remove`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-comments'] }),
  });
  return (
    <div>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search comments" />
      <ul className="mt-4 divide-y divide-border overflow-hidden rounded-[18px] border border-border bg-surface shadow-card">
        {(comments.data ?? []).map((c) => (
          <li key={c.id} className="flex flex-col items-start justify-between gap-3 px-4 py-4 sm:flex-row">
            <div>
              <p className="text-sm text-ink">{c.content}</p>
              <p className="text-xs text-muted">
                @{c.user.username} on {c.poll.question}
              </p>
            </div>
            <Button size="sm" variant="danger" onClick={() => remove.mutate(c.id)}>
              Remove
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Reports() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('PENDING');
  const reports = useQuery({
    queryKey: ['admin-reports', status],
    queryFn: () => client.get<AdminReport[]>(`/api/v1/admin/reports?status=${status}`),
  });
  const review = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => client.patch(`/api/v1/admin/reports/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-reports'] }),
  });
  const STATUSES = ['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'] as const;
  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-semibold capitalize transition',
              status === s ? 'bg-forest text-white shadow-sm' : 'bg-surface text-ink ring-1 ring-border hover:bg-surface-soft',
            )}
          >
            {s.replaceAll('_', ' ').toLowerCase()}
          </button>
        ))}
      </div>
      <ul className="mt-4 space-y-3">
        {(reports.data ?? []).map((r) => (
          <li key={r.id} className="rounded-[18px] border border-border bg-surface p-5 shadow-card">
            <p className="text-sm font-semibold text-ink">
              {r.targetType} · {r.reason.replaceAll('_', ' ')}
            </p>
            <p className="text-sm text-muted">
              by @{r.reporter.username} · {r.description}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => review.mutate({ id: r.id, status: 'RESOLVED' })}>
                Resolve
              </Button>
              <Button size="sm" variant="outline" onClick={() => review.mutate({ id: r.id, status: 'REJECTED' })}>
                Reject
              </Button>
              <Button size="sm" variant="ghost" onClick={() => review.mutate({ id: r.id, status: 'UNDER_REVIEW' })}>
                Review
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
