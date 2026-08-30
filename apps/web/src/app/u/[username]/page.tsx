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
        <div className="p-4">
          <Skeleton className="h-40" />
        </div>
      </AppShell>
    );
  }
  if (profile.isError || !profile.data) {
    return (
      <AppShell>
        <div className="p-6">
          <EmptyState title="User not found" body="This profile may have been removed." />
        </div>
      </AppShell>
    );
  }

  const p = profile.data;
  const visibleTabs = TABS.filter((item) => item.id !== 'saved' || p.isSelf);

  return (
    <AppShell>
      <header className="border-b border-line px-4 py-6">
        <div className="flex items-start justify-between gap-4">
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
        <h1 className="mt-4 font-display text-3xl">{p.displayName || p.username}</h1>
        <p className="text-muted">@{p.username}</p>
        {p.bio ? <p className="mt-3 max-w-xl">{p.bio}</p> : null}
        <p className="mt-3 text-sm text-muted">Joined {new Date(p.createdAt).toLocaleDateString()}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <button type="button" onClick={() => setList('followers')}>
            <strong>{formatCount(p.followerCount)}</strong> followers
          </button>
          <button type="button" onClick={() => setList('following')}>
            <strong>{formatCount(p.followingCount)}</strong> following
          </button>
          <span>
            <strong>{formatCount(p.pollCount)}</strong> polls
          </span>
          <span>
            <strong>{formatCount(p.votesReceived)}</strong> votes received
          </span>
        </div>
      </header>
      <div className="flex border-b border-line">
        {visibleTabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              'flex-1 px-3 py-3 text-sm',
              tab === item.id ? 'border-b-2 border-vote font-semibold' : 'text-muted',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      {tab === 'polls' ? <FeedList path={`/api/v1/users/${username}/polls`} /> : null}
      {tab === 'votes' ? <FeedList path={`/api/v1/users/${username}/votes`} /> : null}
      {tab === 'liked' ? <FeedList path={`/api/v1/users/${username}/liked`} /> : null}
      {tab === 'saved' && (p.isSelf || user?.username === username) ? <FeedList path="/api/v1/users/me/saved" /> : null}
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center" role="dialog">
      <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-3xl bg-paper p-5">
        <div className="flex items-center justify-between">
          <p className="font-display text-2xl capitalize">{kind}</p>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
        <ul className="mt-4 space-y-3">
          {(people.data?.items ?? []).map((person) => (
            <li key={person.id}>
              <a href={`/u/${person.username}`} className="flex items-center gap-3">
                <Avatar name={person.displayName || person.username} src={person.avatarUrl} />
                <span>
                  <span className="block font-medium">{person.displayName || person.username}</span>
                  <span className="text-sm text-muted">@{person.username}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
