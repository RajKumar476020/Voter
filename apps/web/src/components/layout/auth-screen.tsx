import Link from 'next/link';
import { Check, Leaf, Sparkles } from 'lucide-react';

export function AuthScreen({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      {/* Left storytelling panel */}
      <aside className="relative hidden overflow-hidden bg-canvas px-10 py-8 lg:flex lg:flex-col">
        {/* very soft organic wash */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 20% 12%, rgba(24,166,58,0.07), transparent 30%), radial-gradient(circle at 88% 88%, rgba(216,184,90,0.06), transparent 28%)',
          }}
          aria-hidden
        />
        {/* botanical leaf silhouettes — low opacity */}
        <div className="pointer-events-none absolute -right-10 bottom-10 opacity-[0.04]" aria-hidden>
          <Leaf className="h-64 w-64 text-forest" strokeWidth={0.6} />
        </div>
        <div className="pointer-events-none absolute -left-6 top-24 opacity-[0.03]" aria-hidden>
          <Leaf className="h-40 w-40 rotate-12 text-forest" strokeWidth={0.6} />
        </div>

        <Link href="/" className="relative flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-brand text-[15px] font-semibold text-white">V</span>
          <span className="text-[18px] font-semibold tracking-tight text-forest" style={{ letterSpacing: '-0.02em' }}>
            Voter
          </span>
        </Link>

        <div className="relative my-auto max-w-[560px] py-10">
          <h1
            className="text-[44px] font-semibold leading-[0.98] tracking-tight text-ink xl:text-[54px]"
            style={{ letterSpacing: '-0.03em' }}
          >
            Ask. Vote.
            <br />
            <span className="text-brand">Inspire</span> change.
          </h1>
          <p className="mt-4 max-w-[44ch] text-[17px] leading-relaxed text-ink-soft">
            Create polls, share them, and watch the community make up its mind — in real time.
          </p>

          <div className="mt-8 grid gap-3">
            {[
              { title: 'Real-time results', desc: 'Watch sentiment shift as votes arrive.' },
              { title: 'Engaging community', desc: 'Discussions that stay focused on the question.' },
              { title: 'Smart & simple', desc: 'Beautiful polls in seconds, not minutes.' },
            ].map((b) => (
              <div key={b.title} className="flex items-start gap-3 rounded-[14px] bg-surface px-4 py-3 shadow-sm ring-1 ring-border/60">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <Check className="h-4 w-4" strokeWidth={2.2} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink">{b.title}</span>
                  <span className="block text-xs leading-relaxed text-muted">{b.desc}</span>
                </span>
              </div>
            ))}
          </div>

          {/* Premium decorative illustration — translucent green card + pedestal */}
          <div className="relative mt-10 flex h-[220px] items-center justify-center">
            {/* pedestal warm ivory */}
            <div className="absolute bottom-6 h-10 w-[220px] rounded-[18px] bg-gradient-to-b from-gold-soft to-[#efe9d3] opacity-80 blur-[0.5px]" aria-hidden />
            {/* dotted texture */}
            <div
              className="absolute bottom-8 left-1/2 h-10 w-[220px] -translate-x-1/2 opacity-[0.06]"
              style={{
                backgroundImage: 'radial-gradient(circle, #12351F 1.2px, transparent 1.2px)',
                backgroundSize: '14px 14px',
              }}
              aria-hidden
            />
            {/* translucent green card */}
            <div className="absolute bottom-12 flex h-[148px] w-[168px] -rotate-[5deg] flex-col rounded-[20px] border border-brand/10 bg-gradient-to-br from-brand/10 via-[#e9f7ea]/70 to-white p-4 shadow-elevated backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white shadow-sm">
                  <Check className="h-4 w-4" strokeWidth={2.4} />
                </span>
                <span className="h-2 w-16 rounded-full bg-brand/20" />
              </div>
              <div className="mt-auto space-y-2">
                <div className="h-2.5 w-full rounded-full bg-brand/12" />
                <div className="h-2.5 w-4/5 rounded-full bg-brand/10" />
                <div className="h-8 w-full rounded-[10px] border border-brand/15 bg-brand-soft/60" />
              </div>
              {/* small gold accent dot */}
              <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-white shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
            </div>
            {/* second card soft offset */}
            <div className="absolute bottom-10 left-1/2 h-[132px] w-[156px] translate-x-6 rotate-[6deg] rounded-[18px] border border-border bg-surface p-3 shadow-card">
              <div className="h-2 w-12 rounded-full bg-border" />
              <div className="mt-3 space-y-2">
                <div className="h-8 rounded-[10px] border border-border bg-surface-soft" />
                <div className="h-8 rounded-[10px] border border-brand/20 bg-brand-soft" />
              </div>
            </div>
            {/* leaf accent */}
            <Leaf className="pointer-events-none absolute bottom-20 right-16 h-10 w-10 rotate-12 text-brand opacity-15" strokeWidth={1.4} />
            <Leaf className="pointer-events-none absolute bottom-28 left-16 -rotate-12 h-8 w-8 text-brand opacity-10" strokeWidth={1.4} />
          </div>
        </div>

        <p className="relative max-w-[38ch] text-xs leading-relaxed text-muted">
          Every vote counts. Every voice matters — crafted for thoughtful communities.
        </p>
      </aside>

      {/* Right form panel */}
      <main className="flex items-center justify-center bg-surface px-5 py-10 sm:px-8 lg:bg-canvas">
        <div className="w-full max-w-[520px] rounded-[24px] border border-border bg-surface p-6 shadow-card sm:p-8 lg:shadow-none lg:border-transparent lg:bg-transparent lg:p-10">
          <Link href="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-brand font-semibold text-white">V</span>
            <span className="text-[18px] font-semibold tracking-tight text-forest">Voter</span>
          </Link>
          <h1 className="text-[26px] font-semibold tracking-tight text-forest sm:text-[28px]" style={{ letterSpacing: '-0.02em' }}>
            {title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
