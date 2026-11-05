'use client';
import { useEffect, useState } from 'react';

export async function api(url, { method = 'GET', body } = {}) {
  const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Request failed');
  return d;
}

export function useMe() {
  const [me, setMe] = useState(null);
  useEffect(() => { api('/api/auth/me').then(setMe).catch(() => {}); }, []);
  return me;
}

export const qs = (o) => new URLSearchParams(Object.fromEntries(Object.entries(o).filter(([, v]) => v))).toString();
