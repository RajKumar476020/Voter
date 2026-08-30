import type { Metadata } from 'next';
import { Figtree, Fraunces } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers/providers';

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'Voter — Ask. Vote. Decide.',
    template: '%s · Voter',
  },
  description: 'A social polling platform where anyone can ask a question and let the community decide.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${figtree.variable} ${fraunces.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
