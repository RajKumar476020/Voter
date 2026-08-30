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
    await client.post(`/api/v1/polls/${poll.id}/share`).catch(() => {});
    if (navigator.share) {
      await navigator.share({ title: poll.question, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
    }
  }

  const closed = poll.status !== 'ACTIVE';
  const showResults = poll.showResults;

  return (
    <article className="overflow-hidden rounded-[18px] border border-border bg-surface shadow-card transition hover:shadow-elevated">
      <div className="p-4 sm:p-[22px]">
        {/* Header */}
        <div className="flex gap-3">
          <Link href={`/u/${poll.author.username}`} className="shrink-0">
            <Avatar name={poll.author.displayName || poll.author.username} src={poll.author.avatarUrl} />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link
                  href={`/u/${poll.author.username}`}
                  className="truncate text-[14.5px] font-semibold tracking-tight text-ink hover:text-brand"
                >
                  {poll.author.displayName || poll.author.username}
                </Link>
                <p className="text-[12.5px] leading-tight text-muted">
                  @{poll.author.username} · {timeAgo(poll.createdAt)}
                  {closed ? ' · Closed' : null}
                </p>
              </div>
              <div className="relative">
                <button
                  type="button"
                  aria-label="More"
                  className="rounded-[10px] p-1.5 text-muted hover:bg-surface-soft hover:text-ink"
                  onClick={() => setMenu((v) => !v)}
                >
                  <MoreHorizontal className="h-5 w-5" strokeWidth={1.9} />
                </button>
                {menu ? (
                  <div className="absolute right-0 z-10 w-44 rounded-[14px] border border-border bg-surface p-1 shadow-elevated">
                    <button
                      className="w-full rounded-[10px] px-3 py-2 text-left text-sm hover:bg-surface-soft"
                      onClick={() => {
                        void navigator.clipboard.writeText(`${window.location.origin}/p/${poll.id}`);
                        setMenu(false);
                      }}
                    >
                      Copy link
                    </button>
                    {user?.id === poll.author.id ? (
                      <button
                        className="w-full rounded-[10px] px-3 py-2 text-left text-sm hover:bg-surface-soft"
                        onClick={() => {
                          setMenu(false);
                          if (confirm('Remove this poll?')) remove.mutate();
                        }}
                      >
                        Delete poll
                      </button>
                    ) : (
                      <button
                        className="w-full rounded-[10px] px-3 py-2 text-left text-sm hover:bg-surface-soft"
                        onClick={() => {
                          setMenu(false);
                          setReport(true);
                        }}
                      >
                        Report
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            <Link href={`/p/${poll.id}`} className="block">
              <h2
                className={cn(
                  'mt-3 font-semibold tracking-tight text-ink hover:text-forest',
                  compact ? 'text-[17px] leading-snug' : 'text-[19px] leading-snug sm:text-[20px]',
                )}
                style={{ letterSpacing: '-0.02em' }}
              >
                {poll.question}
              </h2>
            </Link>
            {poll.description && !compact ? (
              <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-soft">{poll.description}</p>
            ) : null}
            {poll.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={poll.imageUrl} alt="" className="mt-4 max-h-[420px] w-full rounded-[16px] object-cover" />
            ) : null}

            {/* Options */}
            <div className="mt-4 space-y-2.5">
              {poll.options.map((option) => {
                const active = selected.includes(option.id);
                const winner = showResults && poll.winnerOptionId === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleOption(option.id)}
                    className={cn(
                      'relative flex min-h-[44px] w-full items-center overflow-hidden rounded-[10px] border px-3 py-2.5 text-left transition',
                      active
                        ? 'border-brand bg-brand-soft'
                        : 'border-border bg-surface-soft/70 hover:border-border-strong hover:bg-surface-soft',
                      winner && 'border-brand/40',
                    )}
                  >
                    {showResults ? (
                      <motion.span
                        className={cn('absolute inset-y-0 left-0', winner ? 'bg-brand/15' : 'bg-brand/8')}
                        initial={{ width: 0 }}
                        animate={{ width: `${option.percent}%` }}
                        transition={{ duration: 0.45, ease: 'easeOut' }}
                        aria-hidden
                      />
                    ) : null}
                    <span className="relative z-10 flex flex-1 items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={cn(
                            'inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center border-2 transition',
                            poll.pollType === 'MULTIPLE' ? 'rounded-[4px]' : 'rounded-full',
                            active
                              ? 'border-brand bg-brand text-white'
                              : 'border-border-strong bg-surface',
                          )}
                        >
                          {active ? (
                            <span
                              className={cn(
                                poll.pollType === 'MULTIPLE' ? 'h-2 w-2 bg-white rounded-sm' : 'h-1.5 w-1.5 bg-white rounded-full',
                              )}
                            />
                          ) : null}
                        </span>
                        {option.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={option.imageUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
                        ) : null}
                        <span className="text-[14px] font-medium leading-snug text-ink sm:text-[14.5px]">
                          {option.text}
                        </span>
                      </span>
                      {showResults ? (
                        <span className="shrink-0 text-xs tabular-nums text-muted sm:text-[13px]">
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
                className="mt-3 rounded-[10px] bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-40"
              >
                {vote.isPending ? 'Voting…' : 'Cast vote'}
              </button>
            ) : (
              <p className="mt-3 text-[13px] text-muted">
                {formatCount(poll.voteCount)} vote{poll.voteCount === 1 ? '' : 's'}
                {poll.hasVoted ? ' · You voted' : ''}
                {closed ? ' · Closed' : ''}
              </p>
            )}

            {/* Actions — quiet row */}
            <div className="mt-4 flex items-center gap-1 border-t border-border/60 pt-3 text-muted">
              <button
                type="button"
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-[13px] hover:bg-surface-soft hover:text-ink',
                  poll.liked && 'text-brand',
                )}
                onClick={() => {
                  if (!user) {
                    router.push('/login');
                    return;
                  }
                  like.mutate();
                }}
                aria-label="Like"
              >
                <Heart className={cn('h-[18px] w-[18px]', poll.liked && 'fill-current text-brand')} strokeWidth={1.9} />
                {formatCount(poll.likeCount)}
              </button>
              <Link
                href={`/p/${poll.id}`}
                className="inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-[13px] hover:bg-surface-soft hover:text-ink"
              >
                <MessageCircle className="h-[18px] w-[18px]" strokeWidth={1.9} />
                {formatCount(poll.commentCount)}
              </Link>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-[13px] hover:bg-surface-soft hover:text-ink"
                onClick={share}
              >
                <Share2 className="h-[18px] w-[18px]" strokeWidth={1.9} />
                <span className="hidden sm:inline">Share</span>
              </button>
              <button
                type="button"
                className={cn(
                  'ml-auto inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 hover:bg-surface-soft',
                  poll.saved ? 'text-gold' : 'text-muted hover:text-ink',
                )}
                onClick={() => {
                  if (!user) {
                    router.push('/login');
                    return;
                  }
                  save.mutate();
                }}
                aria-label="Save"
              >
                <Bookmark className={cn('h-[18px] w-[18px]', poll.saved && 'fill-current')} strokeWidth={1.9} />
              </button>
            </div>
          </div>
        </div>
      </div>
      {report ? <ReportDialog targetType="POLL" targetId={poll.id} onClose={() => setReport(false)} /> : null}
    </article>
  );
}
