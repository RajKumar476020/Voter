import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const steps: [number, string][] = [
    [60, 's'],
    [60, 'm'],
    [24, 'h'],
    [7, 'd'],
    [4.345, 'w'],
    [12, 'mo'],
  ];
  let value = seconds;
  let unit = 's';
  for (const [div, next] of steps) {
    if (value < div) break;
    value = Math.floor(value / div);
    unit = next;
  }
  return `${value}${unit}`;
}

export function formatCount(n: number) {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`;
  return `${(n / 1_000_000).toFixed(1)}m`;
}
