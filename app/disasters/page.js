'use client';
import { useEffect, useState } from 'react';
import { api, useMe, qs } from '@/lib/client';
import Table from '@/components/Table';

const SEV = ['Low', 'Medium', 'High', 'Critical'];
const TYPES = ['Flood', 'Cyclone', 'Earthquake', 'Landslide', 'Drought', 'Fire'];

export default function Disasters() {
  const admin = useMe()?.role === 'Admin';
  const [rows, setRows] = useState([]);
  const [f, setF] = useState({ q: '', severity: '', status: '' });
  const [form, setForm] = useState({ name: '', type: 'Flood', location: '', start_date: '', severity: 'Medium' });
  const [msg, setMsg] = useState('');
  const load = () => api('/api/disasters?' + qs(f)).then(setRows).catch((e) => setMsg(e.message));
  useEffect(() => { load(); }, [f]);
  const run = async (fn) => { try { await fn(); setMsg(''); load(); } catch (e) { setMsg(e.message); } };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <h1>Disasters</h1>
      <div className="row">
        <input placeholder="Search name, type or location" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} />
        <select value={f.severity} onChange={(e) => setF({ ...f, severity: e.target.value })}>
          <option value="">All severities</option>{SEV.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
          <option value="">All statuses</option><option>Active</option><option>Controlled</option><option>Closed</option>
        </select>
      </div>
      {msg && <p className="err">{msg}</p>}
      <Table
        cols={[['ID', 'Disaster_ID'], ['Name', 'Disaster_Name'], ['Type', 'Disaster_Type'], ['Location', 'Location'], ['Started', 'Start_Date'], ['Severity', 'Severity'], ['Status', 'Status']]}
        rows={rows}
        actions={admin && ((r) => (
          <div className="row">
            <select value={r.Status} onChange={(e) => run(() => api('/api/disasters', { method: 'PATCH', body: { id: r.Disaster_ID, status: e.target.value } }))}>
              <option>Active</option><option>Controlled</option><option>Closed</option>
            </select>
            <button className="danger" onClick={() => run(() => api('/api/disasters?id=' + r.Disaster_ID, { method: 'DELETE' }))}>Delete</button>
          </div>
        ))}
      />
      {admin && (
        <>
          <h2>Add disaster</h2>
          <form className="card row" onSubmit={(e) => { e.preventDefault(); run(() => api('/api/disasters', { method: 'POST', body: form })); }}>
            <input placeholder="Name" value={form.name} onChange={set('name')} required />
            <select value={form.type} onChange={set('type')}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
            <input placeholder="Location" value={form.location} onChange={set('location')} required />
            <input type="date" value={form.start_date} onChange={set('start_date')} required />
            <select value={form.severity} onChange={set('severity')}>{SEV.map((s) => <option key={s}>{s}</option>)}</select>
            <button>Add disaster</button>
          </form>
        </>
      )}
    </>
  );
}
