import { getUser } from '@/lib/auth';

export async function GET() {
  const u = await getUser();
  if (!u) return Response.json({ error: 'Not logged in' }, { status: 401 });
  return Response.json({ name: u.name, role: u.role });
}
