import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createSessionCookie } from '@/lib/auth';

export const runtime = 'nodejs';

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function POST(request: Request) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const { password } = (await request.json().catch(() => ({}))) as { password?: unknown };

  if (typeof password !== 'string' || !safeEqual(password, expected)) {
    // Blunt the brute-force surface a little; add real rate limiting before launch.
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  await createSessionCookie('campus-admin');
  return NextResponse.json({ ok: true });
}
