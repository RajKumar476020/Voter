'use client';

import { AppShell } from '@/components/layout/app-shell';
import { FeedList } from '@/components/feed/feed-list';
import { RequireAuth } from '@/components/auth/require-auth';
import { PageHeader } from '@/components/layout/page-header';

export default function SavedPage() {
  return (
    <AppShell>
      <RequireAuth>
        <div className="px-4 pb-2 pt-6 sm:px-0">
          <PageHeader title="Saved" description="Polls you’ve saved for later." />
        </div>
        <div className="px-4 py-4 sm:px-0">
          <FeedList path="/api/v1/users/me/saved" />
        </div>
      </RequireAuth>
    </AppShell>
  );
}
