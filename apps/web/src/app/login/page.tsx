'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { client } from '@/lib/api';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { useAuth } from '@/components/providers/auth-provider';

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await client.post('/api/v1/auth/login', { identifier, password });
      await refresh();
      router.push('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not sign in.');
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5">
      <Link href="/" className="font-display text-4xl">
        Voter
      </Link>
      <p className="mt-2 text-muted">Sign in and get back to the question.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Field label="Email or username">
          <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
        </Field>
        <Field label="Password">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        {error ? <p className="text-sm text-vote">{error}</p> : null}
        <Button className="w-full" type="submit">
          Sign in
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted">
        <Link href="/forgot-password" className="underline">
          Forgot password
        </Link>
        {' · '}
        <Link href="/signup" className="underline">
          Create an account
        </Link>
      </p>
    </main>
  );
}
