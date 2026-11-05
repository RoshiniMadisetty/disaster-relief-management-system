'use client';
import { useEffect, useState } from 'react';
import { api, useMe, qs } from '@/lib/client';
import Table from '@/components/Table';

const CATS = ['Food', 'Water', 'Medicine', 'Clothing', 'Shelter', 'Other'];

export default function Resources() {
  const admin = useMe()?.role === 'Admin';
  const [rows, setRows] = useState([]);
  const [f, setF] = useState({ q: '', category: '' });
  const [form, setForm] = useState({ name: '', category: 'Food', unit: '', quantity: '', minimum: '' });
  const [add, setAdd] = useState({});
  const [msg, setMsg] = useState('');
  const load = () => api('/api/resources?' + qs(f)).then(setRows).catch((e) => setMsg(e.message));
  useEffect(() => { load(); }, [f]);
  const run = async (fn) => { try { await fn(); setMsg(''); load(); } catch (e) { setMsg(e.message); } };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <h1>Resources</h1>
      <div className="row">
        <input placeholder="Search resource" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} />
        <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
          <option value="">All categories</option>{CATS.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      {msg && <p className="err">{msg}</p>}
      <Table
        cols={[['ID', 'Resource_ID'], ['Name', 'Resource_Name'], ['Category', 'Category'], ['Unit', 'Unit'], ['Available', 'Available_Quantity'], ['Minimum', 'Minimum_Stock'], ['Stock', 'Stock_Status']]}
        rows={rows}
        actions={admin && ((r) => (
          <div className="row">
            <input type="number" style={{ width: 80 }} placeholder="+qty" value={add[r.Resource_ID] || ''} onChange={(e) => setAdd({ ...add, [r.Resource_ID]: e.target.value })} />
            <button onClick={() => run(() => api('/api/resources', { method: 'PATCH', body: { id: r.Resource_ID, add: Number(add[r.Resource_ID] || 0) } }))}>Restock</button>
            <button className="danger" onClick={() => run(() => api('/api/resources?id=' + r.Resource_ID, { method: 'DELETE' }))}>Delete</button>
          </div>
        ))}
      />
      {admin && (
        <>
          <h2>Add resource</h2>
          <form className="card row" onSubmit={(e) => { e.preventDefault(); run(() => api('/api/resources', { method: 'POST', body: form })); }}>
            <input placeholder="Name" value={form.name} onChange={set('name')} required />
            <select value={form.category} onChange={set('category')}>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
            <input placeholder="Unit (kg, litres…)" value={form.unit} onChange={set('unit')} required />
            <input type="number" placeholder="Quantity" value={form.quantity} onChange={set('quantity')} />
            <input type="number" placeholder="Minimum stock" value={form.minimum} onChange={set('minimum')} />
            <button>Add resource</button>
          </form>
        </>
      )}
    </>
  );
}
