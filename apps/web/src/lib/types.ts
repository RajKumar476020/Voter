export type UserPreview = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio?: string | null;
};

export type AuthUser = UserPreview & {
  email: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  bio: string | null;
  createdAt: string;
};

export type PollCard = {
  id: string;
  question: string;
  description: string | null;
  pollType: 'SINGLE' | 'MULTIPLE';
  allowComments: boolean;
  anonymousVoting: boolean;
  expiresAt: string | null;
  status: string;
  imageUrl: string | null;
  voteCount: number;
  commentCount: number;
  likeCount: number;
  shareCount: number;
  createdAt: string;
  category: { id: string; slug: string; name: string } | null;
  tags: { slug: string; name: string }[];
  author: UserPreview;
  options: {
    id: string;
    text: string;
    imageUrl: string | null;
    position: number;
    voteCount: number;
    percent: number;
  }[];
  liked: boolean;
  saved: boolean;
  hasVoted: boolean;
  myOptionIds: string[];
  followingAuthor: boolean;
  showResults: boolean;
  winnerOptionId: string | null;
};

export type FeedPage = {
  items: PollCard[];
  nextCursor: string | null;
};

export type CommentNode = {
  id: string;
  content: string;
  likeCount: number;
  createdAt: string;
  parentId: string | null;
  liked: boolean;
  author: UserPreview & { id: string };
  replies: CommentNode[];
};

export type Profile = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
  pollCount: number;
  followerCount: number;
  followingCount: number;
  votesReceived: number;
  isFollowing: boolean;
  isBlocked: boolean;
  isSelf: boolean;
};
