import { query, tx } from '@/lib/db';
import { withAuth } from '@/lib/auth';

// Allocated items with how much is still undistributed
const REM = `
  SELECT ai.Allocation_ID, ai.Resource_ID, r.Resource_Name, r.Unit,
         ai.Allocated_Quantity - COALESCE((
           SELECT SUM(di.Quantity_Distributed) FROM Distribution_Item di
           JOIN Distribution d ON d.Distribution_ID = di.Distribution_ID
           WHERE d.Allocation_ID = ai.Allocation_ID AND di.Resource_ID = ai.Resource_ID), 0) AS Remaining
  FROM Allocation_Item ai JOIN Resource r ON r.Resource_ID = ai.Resource_ID`;

export const GET = withAuth(null, async (req) => {
  if (new URL(req.url).searchParams.get('options')) {
    return Response.json(await query(`SELECT * FROM (${REM}) t WHERE Remaining > 0 ORDER BY Allocation_ID`));
  }
  return Response.json(
    await query(`
      SELECT d.Distribution_ID, d.Distribution_Date, d.Allocation_ID, b.Beneficiary_Name,
             r.Resource_Name, di.Quantity_Distributed
      FROM Distribution d
      JOIN Beneficiary b ON b.Beneficiary_ID = d.Beneficiary_ID
      JOIN Distribution_Item di ON di.Distribution_ID = d.Distribution_ID
      JOIN Resource r ON r.Resource_ID = di.Resource_ID
      ORDER BY d.Distribution_ID DESC`)
  );
});

// Transaction: record the distribution, then update the allocation status
export const POST = withAuth(['Admin', 'Staff'], async (req) => {
  const { allocation_id, beneficiary_id, resource_id, qty } = await req.json();
  await tx(async (c) => {
    const [r] = await c.query('INSERT INTO Distribution (Allocation_ID, Beneficiary_ID) VALUES (?,?)', [allocation_id, beneficiary_id]);
    await c.query('INSERT INTO Distribution_Item (Distribution_ID, Resource_ID, Quantity_Distributed) VALUES (?,?,?)', [r.insertId, resource_id, qty]);
    const [left] = await c.query(`SELECT COUNT(*) AS n FROM (${REM}) t WHERE Remaining > 0 AND Allocation_ID = ?`, [allocation_id]);
    await c.query('UPDATE Allocation SET Allocation_Status = ? WHERE Allocation_ID = ?', [left[0].n === 0 ? 'Delivered' : 'Dispatched', allocation_id]);
  });
  return Response.json({ ok: true });
});
