'use client';
import { useEffect, useState } from 'react';
import { api, useMe, qs } from '@/lib/client';
import Table from '@/components/Table';

const LEVELS = ['Low', 'Medium', 'High', 'Critical'];

export default function Beneficiaries() {
  const admin = useMe()?.role === 'Admin';
  const [rows, setRows] = useState([]);
  const [lk, setLk] = useState({ centers: [], disasters: [] });
  const [f, setF] = useState({ q: '', level: '', center: '' });
  const [form, setForm] = useState({ name: '', age: '', gender: '', contact: '', level: 'Medium', center_id: '', disaster_id: '' });
  const [msg, setMsg] = useState('');
  const load = () => api('/api/beneficiaries?' + qs(f)).then(setRows).catch((e) => setMsg(e.message));
  useEffect(() => { api('/api/lookup').then(setLk); }, []);
  useEffect(() => { load(); }, [f]);
  const run = async (fn) => { try { await fn(); setMsg(''); load(); } catch (e) { setMsg(e.message); } };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <h1>Beneficiaries</h1>
      <div className="row">
        <input placeholder="Search by name" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} />
        <select value={f.level} onChange={(e) => setF({ ...f, level: e.target.value })}>
          <option value="">All vulnerability levels</option>{LEVELS.map((l) => <option key={l}>{l}</option>)}
        </select>
        <select value={f.center} onChange={(e) => setF({ ...f, center: e.target.value })}>
          <option value="">All centres</option>{lk.centers.map((c) => <option key={c.Center_ID} value={c.Center_ID}>{c.Center_Name}</option>)}
        </select>
      </div>
      {msg && <p className="err">{msg}</p>}
      <Table
        cols={[['ID', 'Beneficiary_ID'], ['Name', 'Beneficiary_Name'], ['Age', 'Age'], ['Gender', 'Gender'], ['Contact', 'Contact_Number'], ['Vulnerability', 'Vulnerability_Level'], ['Centre', 'Center_Name'], ['Disaster', 'Disaster_Name']]}
        rows={rows}
        actions={admin && ((r) => <button className="danger" onClick={() => run(() => api('/api/beneficiaries?id=' + r.Beneficiary_ID, { method: 'DELETE' }))}>Delete</button>)}
      />
      <h2>Register beneficiary</h2>
      <form className="card row" onSubmit={(e) => { e.preventDefault(); run(() => api('/api/beneficiaries', { method: 'POST', body: form })); }}>
        <input placeholder="Name" value={form.name} onChange={set('name')} required />
        <input type="number" placeholder="Age" style={{ width: 80 }} value={form.age} onChange={set('age')} />
        <input placeholder="Gender" style={{ width: 110 }} value={form.gender} onChange={set('gender')} />
        <input placeholder="Contact" value={form.contact} onChange={set('contact')} />
        <select value={form.level} onChange={set('level')}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select>
        <select value={form.center_id} onChange={set('center_id')} required>
          <option value="">Relief centre</option>{lk.centers.map((c) => <option key={c.Center_ID} value={c.Center_ID}>{c.Center_Name}</option>)}
        </select>
        <select value={form.disaster_id} onChange={set('disaster_id')} required>
          <option value="">Disaster</option>{lk.disasters.map((d) => <option key={d.Disaster_ID} value={d.Disaster_ID}>{d.Disaster_Name}</option>)}
        </select>
        <button>Register</button>
      </form>
    </>
  );
}
