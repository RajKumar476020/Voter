'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { client } from '@/lib/api';
import { FeedPage } from '@/lib/types';
import { PollCard } from '@/components/poll/poll-card';
import { EmptyState, Skeleton } from '@/components/ui/empty';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function FeedList({ path }: { path: string }) {
  const router = useRouter();
  const feed = useInfiniteQuery({
    queryKey: ['feed', path],
    queryFn: ({ pageParam }) =>
      client.get<FeedPage>(`${path}${path.includes('?') ? '&' : '?'}limit=20${pageParam ? `&cursor=${pageParam}` : ''}`),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor,
  });

  if (feed.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
        <Skeleton className="h-32" />
      </div>
    );
  }
  if (feed.isError) {
    return (
      <div>
        <EmptyState
          title="Couldn’t load this feed"
          body="The room went quiet. Try again."
          action={{ label: 'Retry', onClick: () => feed.refetch() }}
        />
      </div>
    );
  }

  const items = feed.data?.pages.flatMap((p) => p.items) ?? [];
  if (!items.length) {
    return (
      <div>
        <EmptyState
          title="No polls yet"
          body="Be the first person to ask the community."
          action={{ label: 'Create a poll', onClick: () => router.push('/create') }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((poll) => (
        <PollCard key={poll.id} poll={poll} />
      ))}
      {feed.hasNextPage ? (
        <div className="py-3 text-center">
          <Button variant="outline" onClick={() => feed.fetchNextPage()}>
            Load more
          </Button>
        </div>
      ) : null}
    </div>
  );
}
