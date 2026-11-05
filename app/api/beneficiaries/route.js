import { query, where } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export const GET = withAuth(null, async (req) => {
  const sp = new URL(req.url).searchParams;
  const q = sp.get('q');
  const w = where([
    ['b.Beneficiary_Name LIKE ?', q && `%${q}%`],
    ['b.Vulnerability_Level = ?', sp.get('level')],
    ['b.Center_ID = ?', sp.get('center')],
  ]);
  return Response.json(
    await query(
      `SELECT b.Beneficiary_ID, b.Beneficiary_Name, b.Age, b.Gender, b.Contact_Number,
              b.Vulnerability_Level, rc.Center_Name, d.Disaster_Name
       FROM Beneficiary b
       JOIN Relief_Center rc ON rc.Center_ID = b.Center_ID
       JOIN Disaster d ON d.Disaster_ID = b.Disaster_ID
       ${w.sql}
       ORDER BY FIELD(b.Vulnerability_Level,'Critical','High','Medium','Low'), b.Beneficiary_Name`,
      w.params
    )
  );
});

export const POST = withAuth(['Admin', 'Staff'], async (req) => {
  const b = await req.json();
  const r = await query(
    `INSERT INTO Beneficiary (Beneficiary_Name, Age, Gender, Contact_Number, Vulnerability_Level, Center_ID, Disaster_ID)
     VALUES (?,?,?,?,?,?,?)`,
    [b.name, b.age || null, b.gender || null, b.contact || null, b.level, b.center_id, b.disaster_id]
  );
  return Response.json({ id: r.insertId });
});

export const DELETE = withAuth(['Admin'], async (req) => {
  const id = new URL(req.url).searchParams.get('id');
  await query('DELETE FROM Beneficiary WHERE Beneficiary_ID = ?', [id]);
  return Response.json({ ok: true });
});
