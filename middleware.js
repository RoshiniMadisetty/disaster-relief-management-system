import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Redirects to /login when there is no valid session cookie (API routes check separately via withAuth)
export async function middleware(req) {
  const token = req.cookies.get('token')?.value;
  if (token) {
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
      return NextResponse.next();
    } catch {}
  }
  return NextResponse.redirect(new URL('/login', req.url));
}

export const config = { matcher: ['/((?!login|api|_next|favicon.ico).*)'] };
