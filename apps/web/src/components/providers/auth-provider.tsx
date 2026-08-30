'use client';

import { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/api';
import { AuthUser } from '@/lib/types';

const AuthContext = createContext<{ user: AuthUser | null; loading: boolean; refresh: () => void }>({
  user: null,
  loading: true,
  refresh: () => undefined,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const query = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        return await client.get<AuthUser>('/api/v1/auth/me');
      } catch {
        return null;
      }
    },
  });
  return (
    <AuthContext.Provider value={{ user: query.data ?? null, loading: query.isLoading, refresh: () => query.refetch() }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
