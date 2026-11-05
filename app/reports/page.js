'use client';
import { useEffect, useState } from 'react';
import { api, qs } from '@/lib/client';
import Table from '@/components/Table';

const TYPES = ['Damage', 'Needs', 'Medical', 'Access'];

export default function Reports() {
  const [data, setData] = useState({ reports: [], stats: [] });
  const [lk, setLk] = useState({ disasters: [] });
  const [f, setF] = useState({ q: '', type: '' });
  const [form, setForm] = useState({ disasterId: '', reportType: 'Damage', severity: 3, affectedPeople: '', roadAccess: 'Open', tags: '', notes: '' });
  const [msg, setMsg] = useState('');
  const load = () => api('/api/reports?' + qs(f)).then(setData).catch((e) => setMsg(e.message));
  useEffect(() => { api('/api/lookup').then(setLk); }, []);
  useEffect(() => { load(); }, [f]);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    try { await api('/api/reports', { method: 'POST', body: form }); setMsg(''); setForm({ ...form, notes: '', tags: '', affectedPeople: '' }); load(); }
    catch (x) { setMsg(x.message); }
  };
  const rows = data.reports.map((r) => ({
    ...r, created: r.createdAt?.slice(0, 16).replace('T', ' '), affected: r.details?.affectedPeople, road: r.details?.roadAccess, tagList: (r.tags || []).join(', '),
  }));

  return (
    <>
      <h1>Field reports</h1>
      <p>Stored in MongoDB. Each report type can carry different details, so a flexible document model fits better than fixed table columns.</p>
      {msg && <p className="err">{msg}</p>}
      <h2>Summary (aggregation)</h2>
      <Table cols={[['Type', 'reportType'], ['Reports', 'reports'], ['Avg severity', 'avgSeverity'], ['People affected', 'totalAffected']]} rows={data.stats} />

      <h2>Search reports</h2>
      <div className="row">
        <input placeholder="Search notes and tags" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} />
        <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
          <option value="">All types</option>{TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      <Table cols={[['Date', 'created'], ['Disaster', 'disasterName'], ['Type', 'reportType'], ['Severity', 'severity'], ['People affected', 'affected'], ['Road access', 'road'], ['Tags', 'tagList'], ['Notes', 'notes'], ['By', 'reportedBy']]} rows={rows} />

      <h2>Add a report</h2>
      <form className="card" onSubmit={submit}>
        <div className="row">
          <select value={form.disasterId} onChange={set('disasterId')} required>
            <option value="">Disaster</option>{lk.disasters.map((d) => <option key={d.Disaster_ID} value={d.Disaster_ID}>{d.Disaster_Name}</option>)}
          </select>
          <select value={form.reportType} onChange={set('reportType')}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
          <select value={form.severity} onChange={set('severity')}>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>Severity {n}</option>)}</select>
          <input type="number" min="0" placeholder="People affected" value={form.affectedPeople} onChange={set('affectedPeople')} />
          <select value={form.roadAccess} onChange={set('roadAccess')}><option>Open</option><option>Limited</option><option>Blocked</option></select>
          <input placeholder="Tags (comma separated)" value={form.tags} onChange={set('tags')} />
        </div>
        <textarea rows="3" placeholder="What did you see on the ground?" value={form.notes} onChange={set('notes')} required />
        <div className="row"><button>Save report</button></div>
      </form>
    </>
  );
}
