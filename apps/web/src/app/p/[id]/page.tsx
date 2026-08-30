import type { Metadata } from 'next';
import { fetchPublic } from '@/lib/public-api';
import { PollCard } from '@/lib/types';
import { PollDetail } from './poll-detail';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const poll = await fetchPublic<PollCard>(`/api/v1/polls/${id}`);
  if (!poll) return { title: 'Poll' };
  const title = poll.question;
  const description = poll.description || `Vote on “${poll.question}” on Voter.`;
  const url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/p/${id}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      images: poll.imageUrl ? [{ url: poll.imageUrl }] : undefined,
    },
  };
}

export default async function PollPage({ params }: Props) {
  const { id } = await params;
  const poll = await fetchPublic<PollCard>(`/api/v1/polls/${id}`);
  const jsonLd = poll
    ? {
        '@context': 'https://schema.org',
        '@type': 'Question',
        name: poll.question,
        text: poll.description || poll.question,
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/p/${id}`,
      }
    : null;

  return (
    <>
      {jsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /> : null}
      <PollDetail id={id} />
    </>
  );
}
