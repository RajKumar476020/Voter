'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GripVertical, ImagePlus, Plus, Trash2, Upload } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { RequireAuth } from '@/components/auth/require-auth';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { PageHeader } from '@/components/layout/page-header';
import { ApiError, client } from '@/lib/api';
import { uploadImage } from '@/lib/upload';
import { PollCard } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

const DURATIONS = [
  { id: 'none', label: 'No expiry' },
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
    <form onSubmit={onSubmit} className="mx-auto max-w-[920px] px-4 pb-10 pt-6 sm:px-0">
      <PageHeader title="Create a poll" description="Ask something amazing." />

      <div className="mt-7 grid gap-6 lg:grid-cols-[1.45fr_0.85fr]">
        {/* Main editor */}
        <div className="space-y-5">
          <div className="rounded-[18px] border border-border bg-surface p-5 shadow-card sm:p-6">
            <Field label="Question" hint={`${question.length}/500`}>
              <Textarea
                value={question}
                maxLength={500}
                placeholder="What’s your question?"
                onChange={(e) => setQuestion(e.target.value)}
                className="min-h-[96px] text-[15px]"
                required
              />
            </Field>
            <div className="mt-4">
              <Field label="Description" hint={`Optional · ${description.length}/2000`}>
                <Textarea
                  value={description}
                  maxLength={2000}
                  placeholder="Add context — optional"
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[84px]"
                />
              </Field>
            </div>
          </div>

          <div className="rounded-[18px] border border-border bg-surface p-5 shadow-card sm:p-6">
            <p className="text-sm font-semibold text-ink">Options</p>
            <p className="text-xs text-muted">Drag to reorder. Add up to 10 choices.</p>
            <div className="mt-3 space-y-2.5">
              {options.map((option, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-2 rounded-[14px] border border-border bg-surface-soft/60 p-3 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <GripVertical className="hidden h-4 w-4 shrink-0 text-muted sm:block" aria-hidden />
                    <Input
                      value={option.text}
                      maxLength={200}
                      placeholder={`Option ${index + 1}`}
                      onChange={(e) =>
                        setOptions((curr) => curr.map((item, i) => (i === index ? { ...item, text: e.target.value } : item)))
                      }
                      className="h-10"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 sm:shrink-0">
                    <label className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-ink ring-1 ring-border hover:bg-mist">
                      <ImagePlus className="h-3.5 w-3.5" />
                      {option.imageUrl ? 'Image ✓' : 'Add image'}
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
                    <button
                      type="button"
                      aria-label="Move up"
                      className="rounded-full p-1.5 text-muted hover:bg-surface hover:text-ink"
                      onClick={() => move(index, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label="Move down"
                      className="rounded-full p-1.5 text-muted hover:bg-surface hover:text-ink"
                      onClick={() => move(index, 1)}
                    >
                      ↓
                    </button>
                    {options.length > 2 ? (
                      <button
                        type="button"
                        aria-label="Remove option"
                        className="rounded-full p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
                        onClick={() => setOptions((curr) => curr.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            {options.length < 10 ? (
              <Button type="button" variant="outline" className="mt-3" onClick={() => setOptions((curr) => [...curr, { text: '' }])}>
                <Plus className="h-4 w-4" /> Add option
              </Button>
            ) : null}
          </div>

          <div className="grid gap-4 rounded-[18px] border border-border bg-surface p-5 shadow-card sm:grid-cols-2 sm:p-6">
            <Field label="Poll type">
              <Select value={pollType} onChange={(e) => setPollType(e.target.value as 'SINGLE' | 'MULTIPLE')}>
                <option value="SINGLE">Single choice</option>
                <option value="MULTIPLE">Multiple choice</option>
              </Select>
            </Field>
            <Field label="Category">
              <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">None</option>
                {(categories.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="rounded-[18px] border border-border bg-surface p-5 shadow-card sm:p-6">
            <Field label="Tags" hint="Comma separated">
              <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="phones, design, inspiration" />
            </Field>

            <Field label="Duration">
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDuration(item.id)}
                    className={cn(
                      'rounded-full px-3.5 py-2 text-sm font-semibold transition',
                      duration === item.id ? 'bg-brand text-white shadow-sm' : 'bg-surface text-ink ring-1 ring-border hover:bg-surface-soft',
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </Field>
            {duration === 'custom' ? (
              <div className="mt-4">
                <Field label="Expires at">
                  <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
                </Field>
              </div>
            ) : null}

            <div className="mt-5 space-y-3 border-t border-border/60 pt-4">
              <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-ink">
                <input
                  type="checkbox"
                  checked={allowComments}
                  onChange={(e) => setAllowComments(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-brand focus:ring-brand/20"
                />
                Allow comments
              </label>
              <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-ink">
                <input
                  type="checkbox"
                  checked={anonymousVoting}
                  onChange={(e) => setAnonymousVoting(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-brand focus:ring-brand/20"
                />
                Anonymous voting
              </label>
            </div>

            {error ? <p className="mt-4 rounded-[10px] bg-danger/8 px-3 py-2 text-sm text-danger">{error}</p> : null}
            <Button className="mt-5 w-full" type="submit" disabled={!canPublish || busy}>
              {busy ? 'Publishing…' : 'Publish poll'}
            </Button>
          </div>
        </div>

        {/* Media / helper rail */}
        <div className="space-y-4">
          <div className="rounded-[18px] border border-border bg-surface p-5 shadow-card">
            <p className="text-sm font-semibold text-ink">Cover image</p>
            <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-[14px] border border-dashed border-border bg-surface-soft/60 px-4 py-8 text-center hover:border-brand/30 hover:bg-brand-soft/40">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-brand shadow-sm">
                <Upload className="h-5 w-5" strokeWidth={1.9} />
              </span>
              <span className="mt-2 text-sm font-semibold text-ink">Upload image</span>
              <span className="text-xs text-muted">PNG, JPG, WEBP — max 5MB</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => onImage(e.target.files?.[0])} />
            </label>
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" className="mt-4 max-h-56 w-full rounded-[14px] object-cover ring-1 ring-border" />
            ) : null}
          </div>

          <div className="rounded-[18px] border border-border bg-forest p-5 text-white shadow-card">
            <p className="text-sm font-semibold">Make it stand out</p>
            <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-white/80">
              <li>• Ask one clear question</li>
              <li>• Keep options distinct</li>
              <li>• Add an image to boost votes</li>
            </ul>
          </div>
        </div>
      </div>
    </form>
  );
}
