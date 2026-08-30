'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiError, client } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';

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
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <Field label="Reset token">
        <Input value={token} onChange={(e) => setToken(e.target.value)} required />
      </Field>
      <Field label="New password">
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
      </Field>
      {error ? <p className="text-sm text-vote">{error}</p> : null}
      <Button className="w-full" type="submit">
        Update password
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5">
      <Link href="/" className="font-display text-4xl">
        Voter
      </Link>
      <p className="mt-2 text-muted">Choose a new password.</p>
      <Suspense>
        <ResetForm />
      </Suspense>
    </main>
  );
}
