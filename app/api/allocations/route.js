import { query } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export const GET = withAuth(null, async (req) => {
  const open = new URL(req.url).searchParams.get('open');
  if (open) {
    // Request items still waiting for stock, most urgent first
    return Response.json(
      await query(`
        SELECT ri.Request_ID, ri.Resource_ID, r.Resource_Name, r.Unit, ar.Priority,
               ri.Quantity_Requested - ri.Quantity_Allocated AS Remaining, r.Available_Quantity AS Stock
        FROM Request_Item ri
        JOIN Aid_Request ar ON ar.Request_ID = ri.Request_ID
        JOIN Resource r ON r.Resource_ID = ri.Resource_ID
        WHERE ri.Quantity_Allocated < ri.Quantity_Requested AND ar.Status IN ('Pending','Partially Allocated')
        ORDER BY FIELD(ar.Priority,'Critical','High','Medium','Low'), ar.Request_Date`)
    );
  }
  return Response.json(
    await query(`
      SELECT a.Allocation_ID, a.Request_ID, rc.Center_Name, r.Resource_Name, ai.Allocated_Quantity,
             a.Allocation_Date, a.Allocation_Status
      FROM Allocation a
      JOIN Allocation_Item ai ON ai.Allocation_ID = a.Allocation_ID
      JOIN Resource r ON r.Resource_ID = ai.Resource_ID
      JOIN Aid_Request ar ON ar.Request_ID = a.Request_ID
      JOIN Relief_Center rc ON rc.Center_ID = ar.Center_ID
      ORDER BY a.Allocation_ID DESC`)
  );
});

// Calls the stored procedure (transaction + triggers do the stock/status updates)
export const POST = withAuth(['Admin'], async (req) => {
  const { request_id, resource_id, qty } = await req.json();
  await query('CALL sp_allocate_resource(?,?,?)', [request_id, resource_id, qty]);
  return Response.json({ ok: true });
});

export const PATCH = withAuth(['Admin'], async (req) => {
  const { id, status } = await req.json();
  await query('UPDATE Allocation SET Allocation_Status = ? WHERE Allocation_ID = ?', [status, id]);
  return Response.json({ ok: true });
});
