import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET);

export const signToken = (payload) =>
  new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('8h').sign(secret());

export async function getUser() {
  const token = cookies().get('token')?.value;
  if (!token) return null;
  try {
    return (await jwtVerify(token, secret())).payload;
  } catch {
    return null;
  }
}

// Wraps an API handler: checks login + role, and returns DB error messages (e.g. trigger errors) as JSON
export function withAuth(roles, handler) {
  return async (req, ctx) => {
    const user = await getUser();
    if (!user) return Response.json({ error: 'Please log in' }, { status: 401 });
    if (roles && !roles.includes(user.role)) return Response.json({ error: 'You do not have permission to do this' }, { status: 403 });
    try {
      return await handler(req, user, ctx);
    } catch (e) {
      return Response.json({ error: e.sqlMessage || e.message }, { status: 400 });
    }
  };
}
