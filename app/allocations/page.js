'use client';
import { useEffect, useState } from 'react';
import { api, useMe } from '@/lib/client';
import Table from '@/components/Table';

const STATUS = ['Pending', 'Approved', 'Dispatched', 'Delivered'];

export default function Allocations() {
  const admin = useMe()?.role === 'Admin';
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState([]);
  const [sel, setSel] = useState('');
  const [qty, setQty] = useState('');
  const [msg, setMsg] = useState('');
  const load = () => {
    api('/api/allocations').then(setRows).catch((e) => setMsg(e.message));
    api('/api/allocations?open=1').then(setOpen).catch(() => {});
  };
  useEffect(() => { load(); }, []);
  const run = async (fn) => { try { await fn(); setMsg(''); setQty(''); load(); } catch (e) { setMsg(e.message); } };
  const allocate = (e) => {
    e.preventDefault();
    const [request_id, resource_id] = sel.split('-');
    run(() => api('/api/allocations', { method: 'POST', body: { request_id, resource_id, qty } }));
  };

  return (
    <>
      <h1>Allocations</h1>
      {msg && <p className="err">{msg}</p>}
      {admin ? (
        <>
          <h2>Allocate stock to a request (most urgent first)</h2>
          <form className="card row" onSubmit={allocate}>
            <select value={sel} onChange={(e) => setSel(e.target.value)} required>
              <option value="">Choose request item</option>
              {open.map((o) => (
                <option key={o.Request_ID + '-' + o.Resource_ID} value={o.Request_ID + '-' + o.Resource_ID}>
                  #{o.Request_ID} [{o.Priority}] {o.Resource_Name}: needs {o.Remaining} {o.Unit}, stock {o.Stock}
                </option>
              ))}
            </select>
            <input type="number" min="1" placeholder="Quantity" value={qty} onChange={(e) => setQty(e.target.value)} required />
            <button>Allocate</button>
          </form>
        </>
      ) : <p>Only admins can allocate stock. You can view allocations below.</p>}
      <Table
        cols={[['ID', 'Allocation_ID'], ['Request', 'Request_ID'], ['Centre', 'Center_Name'], ['Resource', 'Resource_Name'], ['Quantity', 'Allocated_Quantity'], ['Date', 'Allocation_Date'], ['Status', 'Allocation_Status']]}
        rows={rows}
        actions={admin && ((r) => (
          <select value={r.Allocation_Status} onChange={(e) => run(() => api('/api/allocations', { method: 'PATCH', body: { id: r.Allocation_ID, status: e.target.value } }))}>
            {STATUS.map((s) => <option key={s}>{s}</option>)}
          </select>
        ))}
      />
    </>
  );
}
