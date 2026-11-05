import { query, where } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export const GET = withAuth(null, async (req) => {
  const sp = new URL(req.url).searchParams;
  const q = sp.get('q');
  const w = where([
    ["CONCAT_WS(' ', Disaster_Name, Location, Disaster_Type) LIKE ?", q && `%${q}%`],
    ['Severity = ?', sp.get('severity')],
    ['Status = ?', sp.get('status')],
  ]);
  return Response.json(await query(`SELECT * FROM Disaster ${w.sql} ORDER BY Disaster_ID DESC`, w.params));
});

export const POST = withAuth(['Admin'], async (req) => {
  const b = await req.json();
  const r = await query(
    'INSERT INTO Disaster (Disaster_Name, Disaster_Type, Location, Start_Date, Severity) VALUES (?,?,?,?,?)',
    [b.name, b.type, b.location, b.start_date, b.severity]
  );
  return Response.json({ id: r.insertId });
});

export const PATCH = withAuth(['Admin'], async (req) => {
  const { id, status } = await req.json();
  await query('UPDATE Disaster SET Status = ? WHERE Disaster_ID = ?', [status, id]);
  return Response.json({ ok: true });
});

export const DELETE = withAuth(['Admin'], async (req) => {
  const id = new URL(req.url).searchParams.get('id');
  await query('DELETE FROM Disaster WHERE Disaster_ID = ?', [id]);
  return Response.json({ ok: true });
});
