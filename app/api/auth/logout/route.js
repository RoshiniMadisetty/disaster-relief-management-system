export async function POST() {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const res = Response.json({ ok: true });
  res.headers.append('Set-Cookie', `token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secure}`);
  return res;
}
