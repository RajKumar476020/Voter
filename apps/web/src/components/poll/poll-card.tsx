'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bookmark, Heart, MessageCircle, MoreHorizontal, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { PollCard as Poll } from '@/lib/types';
import { cn, formatCount, timeAgo } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { useAuth } from '@/components/providers/auth-provider';
import { client } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ReportDialog } from '@/components/poll/report-dialog';

export function PollCard({ poll, compact = false }: { poll: Poll; compact?: boolean }) {
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string[]>(poll.myOptionIds);
  const [menu, setMenu] = useState(false);
  const [report, setReport] = useState(false);

  const refreshFeeds = () => {
    void qc.invalidateQueries({ queryKey: ['feed'] });
    void qc.invalidateQueries({ queryKey: ['poll', poll.id] });
  };
  const vote = useMutation({
    mutationFn: (optionIds: string[]) => client.post<Poll>(`/api/v1/polls/${poll.id}/vote`, { optionIds }),
    onSuccess: refreshFeeds,
  });
  const like = useMutation({
    mutationFn: () =>
      poll.liked ? client.del(`/api/v1/polls/${poll.id}/like`) : client.post(`/api/v1/polls/${poll.id}/like`),
    onSuccess: refreshFeeds,
  });
  const save = useMutation({
    mutationFn: () =>
      poll.saved ? client.del(`/api/v1/polls/${poll.id}/save`) : client.post(`/api/v1/polls/${poll.id}/save`),
    onSuccess: refreshFeeds,
  });
  const remove = useMutation({
    mutationFn: () => client.del(`/api/v1/polls/${poll.id}`),
    onSuccess: () => {
      refreshFeeds();
      router.push('/');
    },
  });

  function toggleOption(id: string) {
    if (poll.hasVoted || closed) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (poll.pollType === 'SINGLE') {
      setSelected([id]);
      vote.mutate([id]);
    } else {
      setSelected((curr) => (curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id]));
    }
  }

  async function share() {
    const url = `${window.location.origin}/p/${poll.id}`;
    await client.post(`/api/v1/polls/${poll.id}/share`);
    if (navigator.share) {
      await navigator.share({ title: poll.question, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  }

  const closed = poll.status !== 'ACTIVE';
  const showResults = poll.showResults;

  return (
    <article className="border-b border-line px-4 py-5">
      <div className="flex gap-3">
        <Link href={`/u/${poll.author.username}`}>
          <Avatar name={poll.author.displayName || poll.author.username} src={poll.author.avatarUrl} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link href={`/u/${poll.author.username}`} className="font-semibold hover:underline">
                {poll.author.displayName || poll.author.username}
              </Link>
              <p className="text-sm text-muted">
                @{poll.author.username} · {timeAgo(poll.createdAt)}
                {closed ? ' · Closed' : null}
              </p>
            </div>
            <div className="relative">
              <button type="button" aria-label="More" className="rounded-full p-1 hover:bg-black/5" onClick={() => setMenu((v) => !v)}>
                <MoreHorizontal className="h-5 w-5" />
              </button>
              {menu ? (
                <div className="absolute right-0 z-10 w-40 rounded-2xl border border-line bg-paper-2 p-1 shadow-lg">
                  <button
                    className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-black/5"
                    onClick={() => {
                      void navigator.clipboard.writeText(`${window.location.origin}/p/${poll.id}`);
                      setMenu(false);
                    }}
                  >
                    Copy link
                  </button>
                  {user?.id === poll.author.id ? (
                    <button
                      className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-black/5"
                      onClick={() => {
                        setMenu(false);
                        if (confirm('Remove this poll?')) remove.mutate();
                      }}
                    >
                      Delete poll
                    </button>
                  ) : (
                    <button className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-black/5" onClick={() => setReport(true)}>
                      Report
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          <Link href={`/p/${poll.id}`}>
            <h2 className={cn('font-display mt-2 text-xl leading-snug', compact && 'text-lg')}>{poll.question}</h2>
          </Link>
          {poll.description && !compact ? <p className="mt-1 text-sm text-muted">{poll.description}</p> : null}
          {poll.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={poll.imageUrl} alt="" className="mt-3 max-h-80 w-full rounded-2xl object-cover" />
          ) : null}

          <div className="mt-3 space-y-2">
            {poll.options.map((option) => {
              const active = selected.includes(option.id);
              const winner = showResults && poll.winnerOptionId === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleOption(option.id)}
                  className={cn(
                    'relative w-full overflow-hidden rounded-2xl border px-3 py-2.5 text-left',
                    active ? 'border-vote' : 'border-line',
                    winner && 'border-forest',
                  )}
                >
                  {showResults ? (
                    <motion.span
                      className={cn('absolute inset-y-0 left-0', winner ? 'bg-forest/15' : 'bg-ink/8')}
                      initial={{ width: 0 }}
                      animate={{ width: `${option.percent}%` }}
                      transition={{ duration: 0.45 }}
                    />
                  ) : null}
                  <span className="relative z-10 flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className={cn(
                          'inline-flex h-4 w-4 shrink-0 items-center justify-center border',
                          poll.pollType === 'MULTIPLE' ? 'rounded-sm' : 'rounded-full',
                          active ? 'border-vote bg-vote' : 'border-ink/40',
                        )}
                      />
                      {option.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={option.imageUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
                      ) : null}
                      <span className="truncate">{option.text}</span>
                    </span>
                    {showResults ? (
                      <span className="text-sm tabular-nums text-muted">
                        {option.percent}% · {formatCount(option.voteCount)}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>

          {!poll.hasVoted && !closed && poll.pollType === 'MULTIPLE' ? (
            <button
              type="button"
              disabled={!selected.length || vote.isPending}
              onClick={() => vote.mutate(selected)}
              className="mt-3 text-sm font-semibold text-vote disabled:opacity-40"
            >
              {vote.isPending ? 'Voting…' : 'Cast vote'}
            </button>
          ) : (
            <p className="mt-3 text-sm text-muted">{formatCount(poll.voteCount)} votes</p>
          )}

          <div className="mt-3 flex items-center justify-between text-muted">
            <button type="button" className={cn('flex items-center gap-1.5', poll.liked && 'text-vote')} onClick={() => like.mutate()}>
              <Heart className={cn('h-5 w-5', poll.liked && 'fill-current')} />
              {formatCount(poll.likeCount)}
            </button>
            <Link href={`/p/${poll.id}`} className="flex items-center gap-1.5">
              <MessageCircle className="h-5 w-5" />
              {formatCount(poll.commentCount)}
            </Link>
            <button type="button" className="flex items-center gap-1.5" onClick={share}>
              <Share2 className="h-5 w-5" />
              Share
            </button>
            <button type="button" className={cn('flex items-center gap-1.5', poll.saved && 'text-gold')} onClick={() => save.mutate()}>
              <Bookmark className={cn('h-5 w-5', poll.saved && 'fill-current')} />
            </button>
          </div>
        </div>
      </div>
      {report ? <ReportDialog targetType="POLL" targetId={poll.id} onClose={() => setReport(false)} /> : null}
    </article>
  );
}
