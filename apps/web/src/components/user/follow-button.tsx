'use client';

import { useRouter } from 'next/navigation';
import { client } from '@/lib/api';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function FollowButton({
  userId,
  following,
}: {
  userId: string;
  following: boolean;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const mutate = useMutation({
    mutationFn: () =>
      following ? client.del(`/api/v1/users/${userId}/follow`) : client.post(`/api/v1/users/${userId}/follow`),
    onSuccess: () => qc.invalidateQueries(),
  });

  if (user?.id === userId) return null;

  return (
    <Button
      variant={following ? 'outline' : 'primary'}
      onClick={() => {
        if (!user) {
          router.push('/login');
          return;
        }
        mutate.mutate();
      }}
      disabled={mutate.isPending}
    >
      {following ? 'Following' : 'Follow'}
    </Button>
  );
}
