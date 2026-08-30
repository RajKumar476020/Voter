'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiError, client } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { AuthScreen } from '@/components/layout/auth-screen';

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [token, setToken] = useState(params.get('token') ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await client.post('/api/v1/auth/reset-password', { token, password });
      router.push('/login');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reset password.');
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Reset token">
        <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste your reset token" required />
      </Field>
      <Field label="New password">
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={8} required />
      </Field>
      {error ? <p className="rounded-[10px] bg-danger/8 px-3 py-2 text-sm text-danger">{error}</p> : null}
      <Button className="w-full" type="submit">
        Update password
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthScreen title="Choose a new password" subtitle="Pick something you’ll remember.">
      <Suspense>
        <ResetForm />
      </Suspense>
    </AuthScreen>
  );
}
