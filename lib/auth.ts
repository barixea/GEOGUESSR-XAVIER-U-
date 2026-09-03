import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { MAX_AGE_SECONDS, SESSION_COOKIE, sessionSecret, verifySessionToken } from './auth-edge';

export { SESSION_COOKIE, verifySessionToken };

export async function createSessionCookie(subject: string) {
  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(sessionSecret());

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Call at the top of every admin route handler and admin page. */
export async function requireAdmin() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}
