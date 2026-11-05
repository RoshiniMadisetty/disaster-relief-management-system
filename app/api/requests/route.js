import { query, tx, where } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export const GET = withAuth(null, async (req) => {
  const sp = new URL(req.url).searchParams;
  const w = where([
    ['ar.Status = ?', sp.get('status')],
    ['ar.Priority = ?', sp.get('priority')],
  ]);
  return Response.json(
    await query(
      `SELECT ar.Request_ID, rc.Center_Name, d.Disaster_Name, ar.Request_Date, ar.Priority, ar.Status,
              GROUP_CONCAT(CONCAT(r.Resource_Name, ' ', ri.Quantity_Allocated, '/', ri.Quantity_Requested) SEPARATOR ', ') AS Items
       FROM Aid_Request ar
       JOIN Relief_Center rc ON rc.Center_ID = ar.Center_ID
       JOIN Disaster d ON d.Disaster_ID = ar.Disaster_ID
       LEFT JOIN Request_Item ri ON ri.Request_ID = ar.Request_ID
       LEFT JOIN Resource r ON r.Resource_ID = ri.Resource_ID
       ${w.sql}
       GROUP BY ar.Request_ID, rc.Center_Name, d.Disaster_Name, ar.Request_Date, ar.Priority, ar.Status
       ORDER BY ar.Request_ID DESC`,
      w.params
    )
  );
});

// Transaction: request header + all its items are saved together or not at all
export const POST = withAuth(['Admin', 'Staff'], async (req) => {
  const { center_id, disaster_id, priority, items } = await req.json();
  if (!items?.length) throw new Error('Add at least one item to the request');
  const id = await tx(async (c) => {
    const [r] = await c.query('INSERT INTO Aid_Request (Center_ID, Disaster_ID, Priority) VALUES (?,?,?)', [center_id, disaster_id, priority]);
    for (const it of items) {
      await c.query('INSERT INTO Request_Item (Request_ID, Resource_ID, Quantity_Requested) VALUES (?,?,?)', [r.insertId, it.resource_id, it.qty]);
    }
    return r.insertId;
  });
  return Response.json({ id });
});

export const PATCH = withAuth(['Admin'], async (req) => {
  const { id, status } = await req.json();
  await query('UPDATE Aid_Request SET Status = ? WHERE Request_ID = ?', [status, id]);
  return Response.json({ ok: true });
});

export const DELETE = withAuth(['Admin'], async (req) => {
  const id = new URL(req.url).searchParams.get('id');
  await query('DELETE FROM Aid_Request WHERE Request_ID = ?', [id]);
  return Response.json({ ok: true });
});
