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
    <div>
      <div className="border-b border-line px-4 py-4">
        <h1 className="font-display text-3xl">Admin</h1>
        <div className="mt-3 flex gap-2 overflow-x-auto">
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
      {tab === 'Dashboard' ? <Dashboard /> : null}
      {tab === 'Users' ? <Users /> : null}
      {tab === 'Polls' ? <Polls /> : null}
      {tab === 'Comments' ? <Comments /> : null}
      {tab === 'Reports' ? <Reports /> : null}
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
    <div className="grid gap-3 p-4 sm:grid-cols-2">
      {cards.map(([label, value]) => (
        <div key={label} className="rounded-3xl border border-line bg-paper-2 p-4">
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-1 font-display text-3xl">{value}</p>
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
    <div className="p-4">
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users" />
      <ul className="mt-4 divide-y divide-line">
        {(users.data ?? []).map((u) => (
          <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div>
              <p className="font-medium">
                {u.displayName || u.username} <span className="text-muted">@{u.username}</span>
              </p>
              <p className="text-sm text-muted">
                {u.email} · {u.status} · {u.role}
              </p>
            </div>
            <div className="flex gap-2">
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
    <div className="p-4">
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search polls" />
      <ul className="mt-4 divide-y divide-line">
        {(polls.data ?? []).map((p) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div>
              <a className="font-medium hover:underline" href={`/p/${p.id}`}>
                {p.question}
              </a>
              <p className="text-sm text-muted">
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
    <div className="p-4">
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search comments" />
      <ul className="mt-4 divide-y divide-line">
        {(comments.data ?? []).map((c) => (
          <li key={c.id} className="flex items-start justify-between gap-3 py-3">
            <div>
              <p>{c.content}</p>
              <p className="text-sm text-muted">
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
  return (
    <div className="p-4">
      <div className="flex gap-2">
        {['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={cn('rounded-full px-3 py-1 text-sm', status === s ? 'bg-ink text-paper' : 'bg-line')}
          >
            {s.replace('_', ' ').toLowerCase()}
          </button>
        ))}
      </div>
      <ul className="mt-4 divide-y divide-line">
        {(reports.data ?? []).map((r) => (
          <li key={r.id} className="py-3">
            <p className="font-medium">
              {r.targetType} · {r.reason.replaceAll('_', ' ')}
            </p>
            <p className="text-sm text-muted">
              by @{r.reporter.username} · {r.description}
            </p>
            <div className="mt-2 flex gap-2">
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
