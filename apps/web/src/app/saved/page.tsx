'use client';

import { AppShell } from '@/components/layout/app-shell';
import { FeedList } from '@/components/feed/feed-list';
import { RequireAuth } from '@/components/auth/require-auth';

export default function SavedPage() {
  return (
    <AppShell>
      <RequireAuth>
        <div className="border-b border-line px-4 py-4">
          <h1 className="font-display text-3xl">Saved</h1>
        </div>
        <FeedList path="/api/v1/users/me/saved" />
      </RequireAuth>
    </AppShell>
  );
}
