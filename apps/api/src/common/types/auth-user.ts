import { Role, AccountStatus } from '@prisma/client';

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  role: Role;
  status: AccountStatus;
  displayName: string | null;
  avatarUrl: string | null;
};
