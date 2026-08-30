'use client';

import Link from 'next/link';
import { Heart, Trash2 } from 'lucide-react';
import { CommentNode } from '@/lib/types';
import { Avatar } from '@/components/ui/avatar';
import { timeAgo } from '@/lib/utils';
import { client } from '@/lib/api';
import { useAuth } from '@/components/providers/auth-provider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ReportDialog } from '@/components/poll/report-dialog';
import { cn } from '@/lib/utils';

export function CommentThread({ pollId, comments }: { pollId: string; comments: CommentNode[] }) {
  return (
    <div className="divide-y divide-border/60">
      {comments.map((comment) => (
        <CommentItem key={comment.id} pollId={pollId} comment={comment} />
      ))}
    </div>
  );
}

function CommentItem({ pollId, comment, nested = false }: { pollId: string; comment: CommentNode; nested?: boolean }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [reply, setReply] = useState(false);
  const [text, setText] = useState('');
  const [report, setReport] = useState(false);

  const like = useMutation({
    mutationFn: () =>
      comment.liked ? client.del(`/api/v1/comments/${comment.id}/like`) : client.post(`/api/v1/comments/${comment.id}/like`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', pollId] }),
  });
  const remove = useMutation({
    mutationFn: () => client.del(`/api/v1/comments/${comment.id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', pollId] }),
  });
  const send = useMutation({
    mutationFn: () => client.post(`/api/v1/polls/${pollId}/comments`, { content: text, parentId: comment.id }),
    onSuccess: () => {
      setText('');
      setReply(false);
      qc.invalidateQueries({ queryKey: ['comments', pollId] });
    },
  });

  return (
    <div className={cn('py-4', nested && 'ml-4 border-l border-border pl-4 sm:ml-8')}>
      <div className="flex gap-3">
        <Link href={`/u/${comment.author.username}`}>
          <Avatar name={comment.author.displayName || comment.author.username} src={comment.author.avatarUrl} size="sm" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-sm">
            <Link href={`/u/${comment.author.username}`} className="font-semibold text-ink hover:text-brand">
              {comment.author.displayName || comment.author.username}
            </Link>{' '}
            <span className="text-muted">{timeAgo(comment.createdAt)}</span>
          </p>
          <p className="mt-1 whitespace-pre-wrap text-[14.5px] leading-relaxed text-ink-soft">{comment.content}</p>
          <div className="mt-2 flex items-center gap-4 text-sm text-muted">
            <button type="button" className={cn('flex items-center gap-1.5 hover:text-ink', comment.liked && 'text-brand')} onClick={() => like.mutate()}>
              <Heart className={cn('h-4 w-4', comment.liked && 'fill-current text-brand')} strokeWidth={1.9} />
              {comment.likeCount}
            </button>
            {!nested ? (
              <button type="button" className="hover:text-ink" onClick={() => setReply((v) => !v)}>
                Reply
              </button>
            ) : null}
            <button type="button" className="hover:text-ink" onClick={() => setReport(true)}>
              Report
            </button>
            {user && (user.id === comment.author.id || user.role !== 'USER') ? (
              <button type="button" onClick={() => remove.mutate()} className="hover:text-danger">
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          {reply ? (
            <form
              className="mt-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (text.trim()) send.mutate();
              }}
            >
              <textarea
                className="min-h-16 w-full rounded-[12px] border border-border bg-surface-soft/60 px-3 py-2 text-sm placeholder:text-placeholder focus:border-brand focus:ring-[3px] focus:ring-brand/10 outline-none"
                maxLength={2000}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write a reply"
              />
              <button type="submit" className="mt-2 rounded-[11px] bg-brand px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-40" disabled={!text.trim() || send.isPending}>
                Reply
              </button>
            </form>
          ) : null}
          {comment.replies?.map((replyNode) => (
            <CommentItem key={replyNode.id} pollId={pollId} comment={replyNode} nested />
          ))}
        </div>
      </div>
      {report ? <ReportDialog targetType="COMMENT" targetId={comment.id} onClose={() => setReport(false)} /> : null}
    </div>
  );
}
