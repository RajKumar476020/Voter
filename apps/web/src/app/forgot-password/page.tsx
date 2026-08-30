'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { ApiError, client } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { AuthScreen } from '@/components/layout/auth-screen';

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
    <AuthScreen title="Reset password" subtitle="We’ll send a reset link if that email exists.">
      {sent ? (
        <div className="space-y-4">
          <div className="rounded-[14px] border border-brand/20 bg-brand-soft px-4 py-3 text-sm leading-relaxed text-forest">
            If an account exists for that email, a reset was created. Check your inbox.
          </div>
          {devToken ? (
            <p className="rounded-[12px] border border-border bg-surface px-4 py-3 text-sm">
              Dev token:{' '}
              <Link className="font-semibold text-brand underline" href={`/reset-password?token=${devToken}`}>
                reset password
              </Link>
            </p>
          ) : null}
          <Link href="/login" className="inline-flex text-sm font-semibold text-brand hover:underline">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </Field>
          {error ? <p className="rounded-[10px] bg-danger/8 px-3 py-2 text-sm text-danger">{error}</p> : null}
          <Button className="w-full" type="submit">
            Send reset link
          </Button>
          <p className="text-center text-sm text-muted">
            <Link href="/login" className="font-medium text-brand hover:underline">
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </AuthScreen>
  );
}
