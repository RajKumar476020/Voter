import { client } from './api';

export async function uploadImage(file: File, kind: 'polls' | 'avatar' = 'polls') {
  const form = new FormData();
  form.append('file', file);
  const path = kind === 'avatar' ? '/api/v1/uploads/avatar' : '/api/v1/uploads';
  return client.post<{ url: string }>(path, form);
}
