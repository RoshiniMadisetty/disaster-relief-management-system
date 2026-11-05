'use client';
import Link from 'next/link';
import { api, useMe } from '@/lib/client';

const links = [
  ['/', 'Dashboard'], ['/disasters', 'Disasters'], ['/resources', 'Resources'], ['/beneficiaries', 'Beneficiaries'],
  ['/requests', 'Aid requests'], ['/allocations', 'Allocations'], ['/distributions', 'Distributions'], ['/reports', 'Field reports'],
];

export default function Nav() {
  const me = useMe();
  if (!me) return null;
  const logout = async () => { await api('/api/auth/logout', { method: 'POST' }); window.location.href = '/login'; };
  return (
    <nav>
      {links.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
      <span className="spacer" />
      <span>{me.name} ({me.role})</span>
      <button onClick={logout}>Log out</button>
    </nav>
  );
}
