import { query } from '@/lib/db';
import { withAuth } from '@/lib/auth';
import { reportsCol, reportStats } from '@/lib/mongo';

const TYPES = ['Damage', 'Needs', 'Medical', 'Access'];

// MongoDB: flexible field reports (text search + aggregation)
export const GET = withAuth(null, async (req) => {
  const sp = new URL(req.url).searchParams;
  const filter = {};
  if (sp.get('q')) filter.$text = { $search: sp.get('q') };
  if (sp.get('type')) filter.reportType = sp.get('type');
  const col = await reportsCol();
  const reports = await col.find(filter).sort({ createdAt: -1 }).limit(100).toArray();
  return Response.json({ reports, stats: await reportStats() });
});

export const POST = withAuth(['Admin', 'Staff'], async (req, user) => {
  const b = await req.json();
  const [d] = await query('SELECT Disaster_Name FROM Disaster WHERE Disaster_ID = ?', [b.disasterId]);
  if (!d) throw new Error('Choose a valid disaster');
  if (!TYPES.includes(b.reportType)) throw new Error('Choose a valid report type');
  const severity = Number(b.severity);
  if (!(severity >= 1 && severity <= 5)) throw new Error('Severity must be between 1 and 5');
  if (!b.notes?.trim()) throw new Error('Notes are required');

  const doc = {
    disasterId: Number(b.disasterId),
    disasterName: d.Disaster_Name,
    reportType: b.reportType,
    severity,
    notes: b.notes.trim(),
    tags: (b.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
    details: { affectedPeople: Number(b.affectedPeople) || 0, roadAccess: b.roadAccess || 'Unknown' },
    reportedBy: user.name,
    createdAt: new Date(),
  };
  await (await reportsCol()).insertOne(doc);
  return Response.json({ ok: true });
});
