'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { ApiError, client } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const result = await client.post<{ sent: boolean; devToken?: string }>('/api/v1/auth/forgot-password', { email });
      setSent(true);
      setDevToken(result.devToken ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send a reset link.');
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5">
      <Link href="/" className="font-display text-4xl">
        Voter
      </Link>
      <p className="mt-2 text-muted">We’ll send a reset link if that email exists.</p>
      {sent ? (
        <div className="mt-8 space-y-3">
          <p>If an account exists for that email, a reset was created.</p>
          {devToken ? (
            <p className="rounded-2xl bg-paper-2 p-3 text-sm">
              Dev token:{' '}
              <Link className="underline" href={`/reset-password?token=${devToken}`}>
                reset password
              </Link>
            </p>
          ) : null}
          <Link href="/login" className="text-sm underline">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          {error ? <p className="text-sm text-vote">{error}</p> : null}
          <Button className="w-full" type="submit">
            Send reset
          </Button>
        </form>
      )}
    </main>
  );
}
