'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { RequireAuth } from '@/components/auth/require-auth';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { ApiError, client } from '@/lib/api';
import { uploadImage } from '@/lib/upload';
import { useAuth } from '@/components/providers/auth-provider';
import { AuthUser } from '@/lib/types';
import { PageHeader } from '@/components/layout/page-header';

export default function SettingsPage() {
  return (
    <AppShell>
      <RequireAuth>
        <SettingsForm />
      </RequireAuth>
    </AppShell>
  );
}

function SettingsForm() {
  const { user, refresh } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDisplayName(user?.displayName ?? '');
    setBio(user?.bio ?? '');
    setAvatarUrl(user?.avatarUrl ?? '');
  }, [user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaved(false);
    try {
      await client.patch<AuthUser>('/api/v1/users/me', { displayName, bio, avatarUrl: avatarUrl || undefined });
      await refresh();
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save profile.');
    }
  }

  async function logout() {
    await client.post('/api/v1/auth/logout');
    await refresh();
    router.push('/');
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl px-4 pb-10 pt-6 sm:px-0">
      <PageHeader title="Settings" description="Update how you appear on Voter." />
      <div className="mt-6 space-y-5 rounded-[18px] border border-border bg-surface p-6 shadow-card sm:p-7">
        <Field label="Display name">
          <Input value={displayName} maxLength={50} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
        </Field>
        <Field label="Bio" hint={`${bio.length}/160`}>
          <Textarea value={bio} maxLength={160} onChange={(e) => setBio(e.target.value)} placeholder="Tell the community about yourself" />
        </Field>
        <Field label="Avatar">
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const uploaded = await uploadImage(file, 'avatar');
              setAvatarUrl(uploaded.url);
            }}
          />
        </Field>
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-20 w-20 rounded-full object-cover ring-1 ring-border" />
        ) : null}
        {error ? <p className="rounded-[10px] bg-danger/8 px-3 py-2 text-sm text-danger">{error}</p> : null}
        {saved ? <p className="rounded-[10px] bg-brand-soft px-3 py-2 text-sm font-medium text-forest">Saved — your profile is up to date.</p> : null}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="submit">Save changes</Button>
          <Button type="button" variant="outline" onClick={logout}>
            Log out
          </Button>
        </div>
      </div>
    </form>
  );
}
