'use client';
import { useEffect, useState } from 'react';
import { api, useMe, qs } from '@/lib/client';
import Table from '@/components/Table';

const PRI = ['Low', 'Medium', 'High', 'Critical'];
const STATUS = ['Pending', 'Partially Allocated', 'Allocated', 'Rejected', 'Completed'];

export default function Requests() {
  const admin = useMe()?.role === 'Admin';
  const [rows, setRows] = useState([]);
  const [lk, setLk] = useState({ centers: [], disasters: [], resources: [] });
  const [f, setF] = useState({ status: '', priority: '' });
  const [form, setForm] = useState({ center_id: '', disaster_id: '', priority: 'High' });
  const [items, setItems] = useState([{ resource_id: '', qty: '' }]);
  const [msg, setMsg] = useState('');
  const load = () => api('/api/requests?' + qs(f)).then(setRows).catch((e) => setMsg(e.message));
  useEffect(() => { api('/api/lookup').then(setLk); }, []);
  useEffect(() => { load(); }, [f]);
  const run = async (fn) => { try { await fn(); setMsg(''); load(); } catch (e) { setMsg(e.message); } };
  const setItem = (i, k, v) => setItems(items.map((it, j) => (j === i ? { ...it, [k]: v } : it)));

  return (
    <>
      <h1>Aid requests</h1>
      <div className="row">
        <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
          <option value="">All statuses</option>{STATUS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })}>
          <option value="">All priorities</option>{PRI.map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>
      {msg && <p className="err">{msg}</p>}
      <Table
        cols={[['ID', 'Request_ID'], ['Centre', 'Center_Name'], ['Disaster', 'Disaster_Name'], ['Raised', 'Request_Date'], ['Priority', 'Priority'], ['Status', 'Status'], ['Items (allocated/requested)', 'Items']]}
        rows={rows}
        actions={admin && ((r) => (
          <div className="row">
            <select value={r.Status} onChange={(e) => run(() => api('/api/requests', { method: 'PATCH', body: { id: r.Request_ID, status: e.target.value } }))}>
              {STATUS.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button className="danger" onClick={() => run(() => api('/api/requests?id=' + r.Request_ID, { method: 'DELETE' }))}>Delete</button>
          </div>
        ))}
      />
      <h2>Raise a request</h2>
      <form
        className="card"
        onSubmit={(e) => { e.preventDefault(); run(async () => { await api('/api/requests', { method: 'POST', body: { ...form, items } }); setItems([{ resource_id: '', qty: '' }]); }); }}
      >
        <div className="row">
          <select value={form.center_id} onChange={(e) => setForm({ ...form, center_id: e.target.value })} required>
            <option value="">Relief centre</option>{lk.centers.map((c) => <option key={c.Center_ID} value={c.Center_ID}>{c.Center_Name}</option>)}
          </select>
          <select value={form.disaster_id} onChange={(e) => setForm({ ...form, disaster_id: e.target.value })} required>
            <option value="">Disaster</option>{lk.disasters.map((d) => <option key={d.Disaster_ID} value={d.Disaster_ID}>{d.Disaster_Name}</option>)}
          </select>
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{PRI.map((p) => <option key={p}>{p}</option>)}</select>
        </div>
        {items.map((it, i) => (
          <div className="row" key={i}>
            <select value={it.resource_id} onChange={(e) => setItem(i, 'resource_id', e.target.value)} required>
              <option value="">Resource</option>{lk.resources.map((r) => <option key={r.Resource_ID} value={r.Resource_ID}>{r.Resource_Name} ({r.Unit})</option>)}
            </select>
            <input type="number" min="1" placeholder="Quantity" value={it.qty} onChange={(e) => setItem(i, 'qty', e.target.value)} required />
            {items.length > 1 && <button type="button" className="danger" onClick={() => setItems(items.filter((_, j) => j !== i))}>Remove</button>}
          </div>
        ))}
        <div className="row">
          <button type="button" onClick={() => setItems([...items, { resource_id: '', qty: '' }])}>Add another item</button>
          <button>Submit request</button>
        </div>
      </form>
    </>
  );
}
