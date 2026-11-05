import { query } from '@/lib/db';
import { withAuth } from '@/lib/auth';
import { reportStats } from '@/lib/mongo';

export const GET = withAuth(null, async () => {
  const [stats] = await query(`
    SELECT (SELECT COUNT(*) FROM Disaster WHERE Status = 'Active') AS active_disasters,
           (SELECT COUNT(*) FROM Aid_Request WHERE Status IN ('Pending','Partially Allocated')) AS open_requests,
           (SELECT COUNT(*) FROM Beneficiary) AS beneficiaries,
           (SELECT COALESCE(SUM(Quantity_Distributed),0) FROM Distribution_Item) AS units_distributed`);

  const lowStock = await query('SELECT * FROM Low_Stock_Resources');
  const pendingHigh = await query('SELECT * FROM Pending_High_Priority_Requests');

  // JOIN + GROUP BY + HAVING + aggregate
  const perDisaster = await query(`
    SELECT d.Disaster_Name, d.Severity, COUNT(ar.Request_ID) AS Requests,
           SUM(ar.Status IN ('Pending','Partially Allocated')) AS Open_Requests
    FROM Disaster d JOIN Aid_Request ar ON ar.Disaster_ID = d.Disaster_ID
    GROUP BY d.Disaster_ID, d.Disaster_Name, d.Severity
    HAVING COUNT(ar.Request_ID) >= 1
    ORDER BY Requests DESC`);

  const topDistributed = await query(`
    SELECT r.Resource_Name, r.Category, SUM(di.Quantity_Distributed) AS Total_Distributed
    FROM Distribution_Item di JOIN Resource r ON r.Resource_ID = di.Resource_ID
    GROUP BY r.Resource_ID, r.Resource_Name, r.Category
    ORDER BY Total_Distributed DESC LIMIT 5`);

  let reportSummary = [];
  try { reportSummary = await reportStats(); } catch {}

  return Response.json({ stats, lowStock, pendingHigh, perDisaster, topDistributed, reportSummary });
});
