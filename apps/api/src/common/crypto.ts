import { createHash, randomBytes } from 'crypto';

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString('hex');
}

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}
