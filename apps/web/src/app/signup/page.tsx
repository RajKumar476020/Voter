'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ApiError, client } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { useAuth } from '@/components/providers/auth-provider';
import { AuthScreen } from '@/components/layout/auth-screen';

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
    <AuthScreen title="Create your account" subtitle="Let’s get you started.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Username" hint="Letters, numbers, and underscores.">
          <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="alex_morgan" minLength={3} maxLength={20} required />
        </Field>
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        </Field>
        <Field label="Display name" hint="Optional">
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Alex Morgan" maxLength={50} />
        </Field>
        <Field label="Password" hint="At least 8 characters.">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={8} required />
        </Field>
        {error ? <p className="rounded-[10px] bg-danger/8 px-3 py-2 text-sm text-danger">{error}</p> : null}
        <Button className="w-full" type="submit">
          Create account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-brand hover:text-brand-dark hover:underline">
          Sign in
        </Link>
      </p>
    </AuthScreen>
  );
}
