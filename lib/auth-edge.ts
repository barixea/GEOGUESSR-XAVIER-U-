import { jwtVerify } from 'jose';

export const SESSION_COOKIE = 'xu_admin_session';
export const MAX_AGE_SECONDS = 60 * 60 * 8;

// Edge-safe auth (no server-only imports). Middleware uses this.
export function sessionSecret() {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value) throw new Error('ADMIN_SESSION_SECRET is not set');
  return new TextEncoder().encode(value);
}

export async function verifySessionToken(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionSecret(), { algorithms: ['HS256'] });
    return payload.role === 'admin' ? payload : null;
  } catch {
    return null;
  }
}
