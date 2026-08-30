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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center" role="dialog">
      <div className="w-full max-w-md rounded-3xl bg-paper p-5">
        {done ? (
          <div className="space-y-3">
            <p className="font-display text-2xl">Report sent</p>
            <p className="text-muted">Thanks. Moderators will review it.</p>
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="font-display text-2xl">Report</p>
            <div className="flex flex-wrap gap-2">
              {REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`rounded-full px-3 py-1 text-sm ${reason === r ? 'bg-ink text-paper' : 'bg-line'}`}
                >
                  {r.replaceAll('_', ' ').toLowerCase()}
                </button>
              ))}
            </div>
            <Field label="Details">
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
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
