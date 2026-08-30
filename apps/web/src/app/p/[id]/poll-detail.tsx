'use client';

import { FormEvent, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/app-shell';
import { PollCard } from '@/components/poll/poll-card';
import { CommentThread } from '@/components/poll/comment-thread';
import { client } from '@/lib/api';
import { CommentNode, PollCard as Poll } from '@/lib/types';
import { EmptyState, Skeleton } from '@/components/ui/empty';
import { useAuth } from '@/components/providers/auth-provider';
import { FollowButton } from '@/components/user/follow-button';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/avatar';
import Link from 'next/link';

export function PollDetail({ id }: { id: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const poll = useQuery({
    queryKey: ['poll', id],
    queryFn: () => client.get<Poll>(`/api/v1/polls/${id}`),
  });
  const comments = useQuery({
    queryKey: ['comments', id],
    queryFn: () => client.get<{ items: CommentNode[] }>(`/api/v1/polls/${id}/comments`),
  });
  const send = useMutation({
    mutationFn: () => client.post(`/api/v1/polls/${id}/comments`, { content: text }),
    onSuccess: () => {
      setText('');
      qc.invalidateQueries({ queryKey: ['comments', id] });
      qc.invalidateQueries({ queryKey: ['poll', id] });
    },
  });

  if (poll.isLoading) {
    return (
      <AppShell>
        <div className="px-4 pt-6 sm:px-0">
          <Skeleton className="h-64" />
        </div>
      </AppShell>
    );
  }
  if (poll.isError || !poll.data) {
    return (
      <AppShell>
        <div className="px-4 py-10 sm:px-0">
          <EmptyState title="Poll unavailable" body="This question may have been removed." />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      right={
        <div className="space-y-4">
          <div className="rounded-[18px] border border-border bg-surface p-5 shadow-card">
            <div className="flex items-center gap-3">
              <Avatar name={poll.data.author.displayName || poll.data.author.username} src={poll.data.author.avatarUrl} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{poll.data.author.displayName || poll.data.author.username}</p>
                <p className="text-xs text-muted">@{poll.data.author.username}</p>
              </div>
            </div>
            <div className="mt-4">
              <FollowButton userId={poll.data.author.id} following={poll.data.followingAuthor} />
            </div>
            {poll.data.category ? (
              <p className="mt-3 inline-flex rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-forest">
                {poll.data.category.name}
              </p>
            ) : null}
          </div>
          <Link href={`/u/${poll.data.author.username}`} className="block text-sm font-medium text-brand hover:underline">
            View profile →
          </Link>
        </div>
      }
    >
      <div className="px-4 pt-6 sm:px-0">
        <PollCard poll={poll.data} />
      </div>
      <section className="mx-4 mb-6 mt-4 rounded-[18px] border border-border bg-surface p-5 shadow-card sm:mx-0 sm:p-6">
        <h2 className="text-[20px] font-semibold tracking-tight text-ink sm:text-[22px]" style={{ letterSpacing: '-0.02em' }}>
          Discussion
        </h2>
        {!poll.data.allowComments ? (
          <p className="mt-3 text-sm leading-relaxed text-muted">Comments are turned off for this poll.</p>
        ) : (
          <>
            <form
              className="mt-4"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                if (!user) {
                  router.push('/login');
                  return;
                }
                if (text.trim()) send.mutate();
              }}
            >
              <textarea
                className="min-h-20 w-full rounded-[12px] border border-border bg-surface-soft/60 px-3 py-3 text-sm placeholder:text-placeholder focus:border-brand focus:ring-[3px] focus:ring-brand/10 outline-none"
                maxLength={2000}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="What do you think?"
              />
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-muted">{text.length}/2000</p>
                <button
                  type="submit"
                  className="rounded-[11px] bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-40"
                  disabled={!text.trim() || send.isPending}
                >
                  Comment
                </button>
              </div>
            </form>
            {comments.data?.items.length ? (
              <div className="mt-5">
                <CommentThread pollId={id} comments={comments.data.items} />
              </div>
            ) : (
              <p className="mt-6 rounded-[12px] border border-dashed border-border bg-surface-soft/50 px-4 py-6 text-center text-sm text-muted">
                No comments yet. Be the first to share your thoughts.
              </p>
            )}
          </>
        )}
      </section>
    </AppShell>
  );
}
