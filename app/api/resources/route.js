import { query, where } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export const GET = withAuth(null, async (req) => {
  const sp = new URL(req.url).searchParams;
  const q = sp.get('q');
  const w = where([
    ['Resource_Name LIKE ?', q && `%${q}%`],
    ['Category = ?', sp.get('category')],
  ]);
  return Response.json(
    await query(
      `SELECT *, IF(Available_Quantity <= Minimum_Stock, 'LOW', 'OK') AS Stock_Status
       FROM Resource ${w.sql} ORDER BY Resource_Name`,
      w.params
    )
  );
});

export const POST = withAuth(['Admin'], async (req) => {
  const b = await req.json();
  const r = await query(
    'INSERT INTO Resource (Resource_Name, Category, Unit, Available_Quantity, Minimum_Stock) VALUES (?,?,?,?,?)',
    [b.name, b.category, b.unit, b.quantity || 0, b.minimum || 0]
  );
  return Response.json({ id: r.insertId });
});

// Restock
export const PATCH = withAuth(['Admin'], async (req) => {
  const { id, add } = await req.json();
  await query('UPDATE Resource SET Available_Quantity = Available_Quantity + ? WHERE Resource_ID = ?', [add, id]);
  return Response.json({ ok: true });
});

export const DELETE = withAuth(['Admin'], async (req) => {
  const id = new URL(req.url).searchParams.get('id');
  await query('DELETE FROM Resource WHERE Resource_ID = ?', [id]);
  return Response.json({ ok: true });
});
