'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/client';
import Table from '@/components/Table';

export default function Dashboard() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api('/api/dashboard').then(setD).catch((e) => setErr(e.message)); }, []);
  if (err) return <p className="err">{err}</p>;
  if (!d) return <p>Loading…</p>;
  const s = d.stats;
  return (
    <>
      <h1>Dashboard</h1>
      <div className="stats">
        <div><strong>{s.active_disasters}</strong><span>Active disasters</span></div>
        <div><strong>{s.open_requests}</strong><span>Open aid requests</span></div>
        <div><strong>{s.beneficiaries}</strong><span>Registered beneficiaries</span></div>
        <div><strong>{s.units_distributed}</strong><span>Units distributed</span></div>
      </div>

      <h2>Pending high-priority requests (view)</h2>
      <Table cols={[['Request', 'Request_ID'], ['Centre', 'Center_Name'], ['Disaster', 'Disaster_Name'], ['Priority', 'Priority'], ['Raised', 'Request_Date']]} rows={d.pendingHigh} />

      <h2>Low-stock resources (view)</h2>
      <Table cols={[['Resource', 'Resource_Name'], ['Category', 'Category'], ['Available', 'Available_Quantity'], ['Minimum', 'Minimum_Stock']]} rows={d.lowStock} />

      <h2>Requests per disaster</h2>
      <Table cols={[['Disaster', 'Disaster_Name'], ['Severity', 'Severity'], ['Requests', 'Requests'], ['Still open', 'Open_Requests']]} rows={d.perDisaster} />

      <h2>Most distributed resources</h2>
      <Table cols={[['Resource', 'Resource_Name'], ['Category', 'Category'], ['Total distributed', 'Total_Distributed']]} rows={d.topDistributed} />

      <h2>Field reports summary (MongoDB aggregation)</h2>
      <Table cols={[['Report type', 'reportType'], ['Reports', 'reports'], ['Avg severity', 'avgSeverity'], ['People affected', 'totalAffected']]} rows={d.reportSummary} />
    </>
  );
}
