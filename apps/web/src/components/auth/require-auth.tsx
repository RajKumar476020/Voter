'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Skeleton } from '@/components/ui/empty';

export function RequireAuth({
  children,
  admin,
}: {
  children: React.ReactNode;
  admin?: boolean;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (admin && user.role === 'USER') {
      router.replace('/');
    }
  }, [admin, loading, router, user]);

  if (loading || !user || (admin && user.role === 'USER')) {
    return (
      <div className="p-6">
        <Skeleton className="h-40" />
      </div>
    );
  }

  return <>{children}</>;
}
