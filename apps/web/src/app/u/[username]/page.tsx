'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/app-shell';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { FollowButton } from '@/components/user/follow-button';
import { FeedList } from '@/components/feed/feed-list';
import { ReportDialog } from '@/components/poll/report-dialog';
import { client } from '@/lib/api';
import { Profile, UserPreview } from '@/lib/types';
import { EmptyState, Skeleton } from '@/components/ui/empty';
import { cn, formatCount } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';

const TABS = [
  { id: 'polls', label: 'Polls' },
  { id: 'votes', label: 'Votes' },
  { id: 'liked', label: 'Liked' },
  { id: 'saved', label: 'Saved' },
];

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const username = params.username;
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [tab, setTab] = useState('polls');
  const [report, setReport] = useState(false);
  const [list, setList] = useState<'followers' | 'following' | null>(null);
  const profile = useQuery({
    queryKey: ['profile', username],
    queryFn: () => client.get<Profile>(`/api/v1/users/${username}`),
  });
  const block = useMutation({
    mutationFn: () =>
      profile.data?.isBlocked
        ? client.del(`/api/v1/users/${profile.data.id}/block`)
        : client.patch(`/api/v1/users/${profile.data!.id}/block`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', username] }),
  });

  if (profile.isLoading) {
    return (
      <AppShell>
        <div className="px-4 pt-6 sm:px-0">
          <Skeleton className="h-40" />
        </div>
      </AppShell>
    );
  }
  if (profile.isError || !profile.data) {
    return (
      <AppShell>
        <div className="px-4 py-10 sm:px-0">
          <EmptyState title="User not found" body="This profile may have been removed." />
        </div>
      </AppShell>
    );
  }

  const p = profile.data;
  const visibleTabs = TABS.filter((item) => item.id !== 'saved' || p.isSelf);

  return (
    <AppShell>
      <header className="rounded-[18px] border border-border bg-surface p-5 shadow-card sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <Avatar name={p.displayName || p.username} src={p.avatarUrl} size="lg" />
          <div className="flex flex-wrap gap-2">
            {p.isSelf ? (
              <Button variant="outline" onClick={() => router.push('/settings')}>
                Edit profile
              </Button>
            ) : (
              <>
                <FollowButton userId={p.id} following={p.isFollowing} />
                <Button variant="ghost" onClick={() => block.mutate()}>
                  {p.isBlocked ? 'Unblock' : 'Block'}
                </Button>
                <Button variant="ghost" onClick={() => setReport(true)}>
                  Report
                </Button>
              </>
            )}
          </div>
        </div>
        <h1 className="mt-4 text-[26px] font-semibold tracking-tight text-forest sm:text-[30px]" style={{ letterSpacing: '-0.025em' }}>
          {p.displayName || p.username}
        </h1>
        <p className="text-sm text-muted">@{p.username}</p>
        {p.bio ? <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-soft">{p.bio}</p> : null}
        <p className="mt-3 text-xs text-muted">Joined {new Date(p.createdAt).toLocaleDateString()}</p>
        <div className="mt-4 flex flex-wrap gap-5 text-sm">
          <button type="button" onClick={() => setList('followers')} className="hover:text-brand">
            <strong className="font-semibold text-ink">{formatCount(p.followerCount)}</strong> <span className="text-muted">followers</span>
          </button>
          <button type="button" onClick={() => setList('following')} className="hover:text-brand">
            <strong className="font-semibold text-ink">{formatCount(p.followingCount)}</strong> <span className="text-muted">following</span>
          </button>
          <span>
            <strong className="font-semibold text-ink">{formatCount(p.pollCount)}</strong> <span className="text-muted">polls</span>
          </span>
          <span>
            <strong className="font-semibold text-ink">{formatCount(p.votesReceived)}</strong> <span className="text-muted">votes received</span>
          </span>
        </div>
      </header>
      <div className="mt-5 flex gap-2 overflow-x-auto">
        {visibleTabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-semibold transition',
              tab === item.id ? 'bg-forest text-white shadow-sm' : 'bg-surface text-ink ring-1 ring-border hover:bg-surface-soft',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {tab === 'polls' ? <FeedList path={`/api/v1/users/${username}/polls`} /> : null}
        {tab === 'votes' ? <FeedList path={`/api/v1/users/${username}/votes`} /> : null}
        {tab === 'liked' ? <FeedList path={`/api/v1/users/${username}/liked`} /> : null}
        {tab === 'saved' && (p.isSelf || user?.username === username) ? <FeedList path="/api/v1/users/me/saved" /> : null}
      </div>
      {list ? <PeopleSheet username={username} kind={list} onClose={() => setList(null)} /> : null}
      {report ? <ReportDialog targetType="USER" targetId={p.id} onClose={() => setReport(false)} /> : null}
    </AppShell>
  );
}

function PeopleSheet({
  username,
  kind,
  onClose,
}: {
  username: string;
  kind: 'followers' | 'following';
  onClose: () => void;
}) {
  const people = useQuery({
    queryKey: ['people', username, kind],
    queryFn: () => client.get<{ items: UserPreview[] }>(`/api/v1/users/${username}/${kind}`),
  });
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 backdrop-blur-sm sm:items-center" role="dialog">
      <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-[20px] border border-border bg-surface p-6 shadow-elevated">
        <div className="flex items-center justify-between">
          <p className="text-xl font-semibold tracking-tight text-ink capitalize">{kind}</p>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <ul className="mt-4 space-y-3">
          {(people.data?.items ?? []).map((person) => (
            <li key={person.id}>
              <a href={`/u/${person.username}`} className="flex items-center gap-3 rounded-[12px] p-2 hover:bg-surface-soft">
                <Avatar name={person.displayName || person.username} src={person.avatarUrl} />
                <span>
                  <span className="block text-sm font-semibold text-ink">{person.displayName || person.username}</span>
                  <span className="text-xs text-muted">@{person.username}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
