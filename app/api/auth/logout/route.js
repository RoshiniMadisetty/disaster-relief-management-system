export async function POST() {
  const res = Response.json({ ok: true });
  res.headers.append('Set-Cookie', 'token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
  return res;
}
