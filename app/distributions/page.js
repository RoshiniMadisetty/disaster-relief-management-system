'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/client';
import Table from '@/components/Table';

export default function Distributions() {
  const [rows, setRows] = useState([]);
  const [opts, setOpts] = useState([]);
  const [bens, setBens] = useState([]);
  const [sel, setSel] = useState('');
  const [ben, setBen] = useState('');
  const [qty, setQty] = useState('');
  const [msg, setMsg] = useState('');
  const load = () => {
    api('/api/distributions').then(setRows).catch((e) => setMsg(e.message));
    api('/api/distributions?options=1').then(setOpts).catch(() => {});
  };
  useEffect(() => { load(); api('/api/lookup').then((l) => setBens(l.beneficiaries)); }, []);
  const submit = async (e) => {
    e.preventDefault();
    const [allocation_id, resource_id] = sel.split('-');
    try { await api('/api/distributions', { method: 'POST', body: { allocation_id, resource_id, beneficiary_id: ben, qty } }); setMsg(''); setQty(''); load(); }
    catch (x) { setMsg(x.message); }
  };

  return (
    <>
      <h1>Distributions</h1>
      {msg && <p className="err">{msg}</p>}
      <h2>Record a distribution</h2>
      <form className="card row" onSubmit={submit}>
        <select value={sel} onChange={(e) => setSel(e.target.value)} required>
          <option value="">Allocated item</option>
          {opts.map((o) => (
            <option key={o.Allocation_ID + '-' + o.Resource_ID} value={o.Allocation_ID + '-' + o.Resource_ID}>
              Allocation #{o.Allocation_ID}: {o.Resource_Name}, {o.Remaining} {o.Unit} left
            </option>
          ))}
        </select>
        <select value={ben} onChange={(e) => setBen(e.target.value)} required>
          <option value="">Beneficiary</option>{bens.map((b) => <option key={b.Beneficiary_ID} value={b.Beneficiary_ID}>{b.Beneficiary_Name}</option>)}
        </select>
        <input type="number" min="1" placeholder="Quantity" value={qty} onChange={(e) => setQty(e.target.value)} required />
        <button>Record distribution</button>
      </form>
      <Table
        cols={[['ID', 'Distribution_ID'], ['Allocation', 'Allocation_ID'], ['Beneficiary', 'Beneficiary_Name'], ['Resource', 'Resource_Name'], ['Quantity', 'Quantity_Distributed'], ['Date', 'Distribution_Date']]}
        rows={rows}
      />
    </>
  );
}
