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
        <div className="p-4">
          <Skeleton className="h-64" />
        </div>
      </AppShell>
    );
  }
  if (poll.isError || !poll.data) {
    return (
      <AppShell>
        <div className="p-6">
          <EmptyState title="Poll unavailable" body="This question may have been removed." />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      right={
        <div className="space-y-4">
          <p className="font-display text-xl">{poll.data.author.displayName || poll.data.author.username}</p>
          <FollowButton userId={poll.data.author.id} following={poll.data.followingAuthor} />
          {poll.data.category ? <p className="text-sm text-muted">{poll.data.category.name}</p> : null}
        </div>
      }
    >
      <PollCard poll={poll.data} />
      <section className="border-t border-line">
        <h2 className="px-4 pt-5 font-display text-2xl">Discussion</h2>
        {!poll.data.allowComments ? (
          <p className="p-4 text-muted">Comments are turned off.</p>
        ) : (
          <>
            <form
              className="px-4 py-3"
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
                className="min-h-20 w-full rounded-2xl border border-line bg-paper-2 px-3 py-2"
                maxLength={2000}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="What do you think?"
              />
              <p className="mt-1 text-right text-xs text-muted">{text.length}/2000</p>
              <button type="submit" className="mt-1 text-sm font-semibold text-vote" disabled={!text.trim() || send.isPending}>
                Comment
              </button>
            </form>
            {comments.data?.items.length ? (
              <CommentThread pollId={id} comments={comments.data.items} />
            ) : (
              <p className="p-4 text-muted">No comments yet. Start the thread.</p>
            )}
          </>
        )}
      </section>
    </AppShell>
  );
}
