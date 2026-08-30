'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { RequireAuth } from '@/components/auth/require-auth';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { ApiError, client } from '@/lib/api';
import { uploadImage } from '@/lib/upload';
import { PollCard } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

const DURATIONS = [
  { id: 'none', label: 'No expiration' },
  { id: '1h', label: '1 hour' },
  { id: '6h', label: '6 hours' },
  { id: '12h', label: '12 hours' },
  { id: '1d', label: '1 day' },
  { id: '3d', label: '3 days' },
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: 'custom', label: 'Custom' },
];

export default function CreatePage() {
  return (
    <AppShell>
      <RequireAuth>
        <CreateForm />
      </RequireAuth>
    </AppShell>
  );
}

function CreateForm() {
  const router = useRouter();
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => client.get<{ id: string; slug: string; name: string }[]>('/api/v1/categories'),
  });
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<{ text: string; imageUrl?: string }[]>([{ text: '' }, { text: '' }]);
  const [pollType, setPollType] = useState<'SINGLE' | 'MULTIPLE'>('SINGLE');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState('');
  const [duration, setDuration] = useState('none');
  const [expiresAt, setExpiresAt] = useState('');
  const [allowComments, setAllowComments] = useState(true);
  const [anonymousVoting, setAnonymousVoting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const canPublish = useMemo(
    () => question.trim().length >= 4 && options.filter((o) => o.text.trim()).length >= 2,
    [options, question],
  );

  function move(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= options.length) return;
    const copy = [...options];
    [copy[index], copy[next]] = [copy[next], copy[index]];
    setOptions(copy);
  }

  async function onImage(file?: File) {
    if (!file) return;
    const uploaded = await uploadImage(file);
    setImageUrl(uploaded.url);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const poll = await client.post<PollCard>('/api/v1/polls', {
        question,
        description: description || undefined,
        imageUrl: imageUrl || undefined,
        options: options
          .filter((o) => o.text.trim())
          .map((o) => ({ text: o.text.trim(), imageUrl: o.imageUrl })),
        pollType,
        categoryId: categoryId || undefined,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        duration: duration === 'custom' ? undefined : duration,
        expiresAt: duration === 'custom' && expiresAt ? new Date(expiresAt).toISOString() : undefined,
        allowComments,
        anonymousVoting,
      });
      router.push(`/p/${poll.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not publish this poll.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <h1 className="font-display text-3xl">Create a poll</h1>
      <Field label="Question" hint={`${question.length}/500`}>
        <Textarea value={question} maxLength={500} onChange={(e) => setQuestion(e.target.value)} required />
      </Field>
      <Field label="Description" hint={`Optional · ${description.length}/2000`}>
        <Textarea value={description} maxLength={2000} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <Field label="Cover image">
        <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onImage(e.target.files?.[0])} />
      </Field>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="max-h-56 w-full rounded-2xl object-cover" />
      ) : null}

      <div>
        <p className="text-sm font-medium">Options</p>
        <div className="mt-2 space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted" aria-hidden />
              <Input
                value={option.text}
                maxLength={200}
                placeholder={`Option ${index + 1}`}
                onChange={(e) =>
                  setOptions((curr) => curr.map((item, i) => (i === index ? { ...item, text: e.target.value } : item)))
                }
              />
              <label className="cursor-pointer text-xs text-muted hover:underline">
                {option.imageUrl ? 'Image' : 'Add image'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const uploaded = await uploadImage(file);
                    setOptions((curr) =>
                      curr.map((item, i) => (i === index ? { ...item, imageUrl: uploaded.url } : item)),
                    );
                  }}
                />
              </label>
              <button type="button" aria-label="Move up" className="text-sm text-muted" onClick={() => move(index, -1)}>
                ↑
              </button>
              <button type="button" aria-label="Move down" className="text-sm text-muted" onClick={() => move(index, 1)}>
                ↓
              </button>
              {options.length > 2 ? (
                <button
                  type="button"
                  aria-label="Remove option"
                  onClick={() => setOptions((curr) => curr.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          ))}
        </div>
        {options.length < 10 ? (
          <Button
            type="button"
            variant="ghost"
            className="mt-2"
            onClick={() => setOptions((curr) => [...curr, { text: '' }])}
          >
            <Plus className="h-4 w-4" /> Add option
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Poll type">
          <select
            className="h-11 w-full rounded-2xl border border-line bg-paper-2 px-3"
            value={pollType}
            onChange={(e) => setPollType(e.target.value as 'SINGLE' | 'MULTIPLE')}
          >
            <option value="SINGLE">Single choice</option>
            <option value="MULTIPLE">Multiple choice</option>
          </select>
        </Field>
        <Field label="Category">
          <select
            className="h-11 w-full rounded-2xl border border-line bg-paper-2 px-3"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">None</option>
            {(categories.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Tags" hint="Comma separated">
        <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="phones, design" />
      </Field>
      <Field label="Duration">
        <div className="flex flex-wrap gap-2">
          {DURATIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setDuration(item.id)}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm',
                duration === item.id ? 'bg-ink text-paper' : 'bg-line',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </Field>
      {duration === 'custom' ? (
        <Field label="Expires at">
          <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </Field>
      ) : null}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={allowComments} onChange={(e) => setAllowComments(e.target.checked)} />
        Allow comments
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={anonymousVoting} onChange={(e) => setAnonymousVoting(e.target.checked)} />
        Anonymous voting
      </label>
      {error ? <p className="text-sm text-vote">{error}</p> : null}
      <Button className="w-full" type="submit" disabled={!canPublish || busy}>
        {busy ? 'Publishing…' : 'Publish poll'}
      </Button>
    </form>
  );
}
