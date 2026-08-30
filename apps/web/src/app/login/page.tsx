'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { client } from '@/lib/api';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { useAuth } from '@/components/providers/auth-provider';
import { AuthScreen } from '@/components/layout/auth-screen';

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
    <AuthScreen title="Welcome back 👋" subtitle="Sign in to continue where you left off.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email or username">
          <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="you@example.com" required />
        </Field>
        <Field label="Password">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
        </Field>
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm font-medium text-brand hover:text-brand-dark hover:underline">
            Forgot password?
          </Link>
        </div>
        {error ? <p className="rounded-[10px] bg-danger/8 px-3 py-2 text-sm text-danger">{error}</p> : null}
        <Button className="w-full" type="submit">
          Sign in
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-semibold text-brand hover:text-brand-dark hover:underline">
          Create one
        </Link>
      </p>
    </AuthScreen>
  );
}
