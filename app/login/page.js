'use client';
import { useState } from 'react';
import { api } from '@/lib/client';

export default function Login() {
  const [f, setF] = useState({ username: '', password: '' });
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    try { await api('/api/auth/login', { method: 'POST', body: f }); window.location.href = '/'; }
    catch (x) { setErr(x.message); }
  };
  return (
    <form className="login card" onSubmit={submit}>
      <h1>Disaster relief system</h1>
      <input placeholder="Username" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} required />
      <input type="password" placeholder="Password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required />
      <button>Log in</button>
      {err && <p className="err">{err}</p>}
    </form>
  );
}
