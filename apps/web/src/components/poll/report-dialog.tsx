'use client';

import { useState } from 'react';
import { client } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Field, Textarea } from '@/components/ui/field';

const REASONS = [
  'SPAM',
  'HARASSMENT',
  'HATE_SPEECH',
  'VIOLENCE',
  'SEXUAL_CONTENT',
  'SCAM',
  'MISINFORMATION',
  'IMPERSONATION',
  'OTHER',
] as const;

export function ReportDialog({
  targetType,
  targetId,
  onClose,
}: {
  targetType: 'POLL' | 'COMMENT' | 'USER' | 'IMAGE';
  targetId: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<(typeof REASONS)[number]>('SPAM');
  const [description, setDescription] = useState('');
  const [done, setDone] = useState(false);

  async function submit() {
    await client.post('/api/v1/reports', { targetType, targetId, reason, description });
    setDone(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 backdrop-blur-sm sm:items-center" role="dialog">
      <div className="w-full max-w-md rounded-[20px] border border-border bg-surface p-6 shadow-elevated">
        {done ? (
          <div className="space-y-4 text-center">
            <p className="text-xl font-semibold tracking-tight text-ink">Report sent</p>
            <p className="text-sm leading-relaxed text-muted">Thanks — moderators will review it shortly.</p>
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-xl font-semibold tracking-tight text-ink">Report</p>
            <div className="flex flex-wrap gap-2">
              {REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${reason === r ? 'bg-forest text-white shadow-sm' : 'bg-surface text-ink ring-1 ring-border hover:bg-surface-soft'}`}
                >
                  {r.replaceAll('_', ' ').toLowerCase()}
                </button>
              ))}
            </div>
            <Field label="Details" hint="Optional — add context for moderators">
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What’s the issue?" />
            </Field>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={submit}>
                Submit
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
