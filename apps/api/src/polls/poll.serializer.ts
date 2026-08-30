import { Poll, PollOption, PollStatus, PollType, User } from '@prisma/client';

export type PollWithRelations = Poll & {
  author: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>;
  options: PollOption[];
  category?: { id: string; slug: string; name: string } | null;
  tags?: { tag: { slug: string; name: string } }[];
  _count?: { comments: number; likes: number };
};

export function serializePoll(
  poll: PollWithRelations,
  extras: {
    liked?: boolean;
    saved?: boolean;
    myOptionIds?: string[];
    hasVoted?: boolean;
    followingAuthor?: boolean;
  } = {},
) {
  const total = poll.voteCount;
  const showResults = extras.hasVoted || poll.status !== PollStatus.ACTIVE || isExpired(poll);
  return {
    id: poll.id,
    question: poll.question,
    description: poll.description,
    pollType: poll.pollType,
    allowComments: poll.allowComments,
    anonymousVoting: poll.anonymousVoting,
    expiresAt: poll.expiresAt,
    status: isExpired(poll) && poll.status === PollStatus.ACTIVE ? PollStatus.EXPIRED : poll.status,
    imageUrl: poll.imageUrl,
    voteCount: poll.voteCount,
    commentCount: poll.commentCount,
    likeCount: poll.likeCount,
    shareCount: poll.shareCount,
    createdAt: poll.createdAt,
    category: poll.category ?? null,
    tags: poll.tags?.map((t) => t.tag) ?? [],
    author: {
      id: poll.author.id,
      username: poll.author.username,
      displayName: poll.author.displayName,
      avatarUrl: poll.author.avatarUrl,
    },
    options: poll.options
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((option) => ({
        id: option.id,
        text: option.text,
        imageUrl: option.imageUrl,
        position: option.position,
        voteCount: showResults ? option.voteCount : 0,
        percent: showResults && total > 0 ? Math.round((option.voteCount / total) * 100) : 0,
      })),
    liked: extras.liked ?? false,
    saved: extras.saved ?? false,
    hasVoted: extras.hasVoted ?? false,
    myOptionIds: extras.myOptionIds ?? [],
    followingAuthor: extras.followingAuthor ?? false,
    showResults,
    winnerOptionId: showResults ? winningOptionId(poll.options) : null,
  };
}

export function isExpired(poll: { expiresAt: Date | null; status: PollStatus }) {
  return poll.status === PollStatus.EXPIRED || (poll.expiresAt != null && poll.expiresAt <= new Date());
}

export function isVotable(poll: { expiresAt: Date | null; status: PollStatus }) {
  return poll.status === PollStatus.ACTIVE && !isExpired(poll);
}

function winningOptionId(options: PollOption[]) {
  if (!options.length) return null;
  return options.reduce((best, option) => (option.voteCount > best.voteCount ? option : best)).id;
}

export { PollType, PollStatus };
