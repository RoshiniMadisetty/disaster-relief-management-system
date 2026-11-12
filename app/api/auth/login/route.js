import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(req) {
  const { username, password } = await req.json();
  const [u] = await query('SELECT * FROM Users WHERE Username = ?', [username]);
  if (!u || !(await bcrypt.compare(password || '', u.Password_Hash))) {
    return Response.json({ error: 'Wrong username or password' }, { status: 401 });
  }
  const token = await signToken({ id: u.User_ID, name: u.Username, role: u.Role });
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const res = Response.json({ role: u.Role });
  res.headers.append('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=28800; SameSite=Lax${secure}`);
  return res;
}
