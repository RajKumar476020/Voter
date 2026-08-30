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
    <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-5 px-4 py-6">
      <h1 className="font-display text-3xl">Settings</h1>
      <Field label="Display name">
        <Input value={displayName} maxLength={50} onChange={(e) => setDisplayName(e.target.value)} />
      </Field>
      <Field label="Bio" hint={`${bio.length}/160`}>
        <Textarea value={bio} maxLength={160} onChange={(e) => setBio(e.target.value)} />
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
      {error ? <p className="text-sm text-vote">{error}</p> : null}
      {saved ? <p className="text-sm text-forest">Saved.</p> : null}
      <Button type="submit">Save</Button>
      <Button type="button" variant="outline" className="ml-2" onClick={logout}>
        Log out
      </Button>
    </form>
  );
}
