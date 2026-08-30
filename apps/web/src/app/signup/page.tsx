'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ApiError, client } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { useAuth } from '@/components/providers/auth-provider';

export default function SignupPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await client.post('/api/v1/auth/signup', {
        username,
        email,
        password,
        displayName: displayName || undefined,
      });
      await refresh();
      router.push('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create your account.');
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <Link href="/" className="font-display text-4xl">
        Voter
      </Link>
      <p className="mt-2 text-muted">Ask a question. Let the room decide.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Field label="Username" hint="Letters, numbers, and underscores.">
          <Input value={username} onChange={(e) => setUsername(e.target.value)} minLength={3} maxLength={20} required />
        </Field>
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Display name" hint="Optional">
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={50} />
        </Field>
        <Field label="Password" hint="At least 8 characters.">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
        </Field>
        {error ? <p className="text-sm text-vote">{error}</p> : null}
        <Button className="w-full" type="submit">
          Create account
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted">
        Already have an account?{' '}
        <Link href="/login" className="underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
