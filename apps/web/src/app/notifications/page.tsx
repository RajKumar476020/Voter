'use client';

import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { RequireAuth } from '@/components/auth/require-auth';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EmptyState, Skeleton } from '@/components/ui/empty';
import { client } from '@/lib/api';
import { UserPreview } from '@/lib/types';
import { timeAgo } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type Notification = {
  id: string;
  type: string;
  read: boolean;
  createdAt: string;
  referenceId: string | null;
  actor: UserPreview | null;
};

const COPY: Record<string, string> = {
  FOLLOW: 'followed you',
  POLL_LIKE: 'liked your poll',
  COMMENT: 'commented on your poll',
  REPLY: 'replied to you',
  VOTE: 'voted on your poll',
  MILESTONE: 'your poll hit a milestone',
  MENTION: 'mentioned you',
};

export default function NotificationsPage() {
  return (
    <AppShell>
      <RequireAuth>
        <NotificationsList />
      </RequireAuth>
    </AppShell>
  );
}

function NotificationsList() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ['notifications'],
    queryFn: () => client.get<{ items: Notification[]; unreadCount: number }>('/api/v1/notifications'),
  });
  const readAll = useMutation({
    mutationFn: () => client.patch('/api/v1/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const readOne = useMutation({
    mutationFn: (id: string) => client.patch(`/api/v1/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  if (list.isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-40" />
      </div>
    );
  }

  const items = list.data?.items ?? [];

  return (
    <div>
      <div className="flex items-center justify-between border-b border-line px-4 py-4">
        <h1 className="font-display text-3xl">Notifications</h1>
        <Button variant="ghost" onClick={() => readAll.mutate()}>
          Mark all read
        </Button>
      </div>
      {!items.length ? (
        <div className="p-6">
          <EmptyState title="You’re all caught up" body="When people vote, follow, or reply, it shows up here." />
        </div>
      ) : (
        <ul>
          {items.map((item) => {
            const href =
              item.type === 'FOLLOW' && item.actor
                ? `/u/${item.actor.username}`
                : item.referenceId
                  ? `/p/${item.referenceId}`
                  : '/';
            return (
              <li key={item.id} className={item.read ? '' : 'bg-vote/5'}>
                <Link
                  href={href}
                  className="flex items-center gap-3 border-b border-line px-4 py-3"
                  onClick={() => {
                    if (!item.read) readOne.mutate(item.id);
                  }}
                >
                  <Avatar
                    name={item.actor?.displayName || item.actor?.username || 'Voter'}
                    src={item.actor?.avatarUrl}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm">
                      <strong>{item.actor?.displayName || item.actor?.username || 'Someone'}</strong>{' '}
                      {COPY[item.type] ?? 'sent a notification'}
                    </span>
                    <span className="text-xs text-muted">{timeAgo(item.createdAt)}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
