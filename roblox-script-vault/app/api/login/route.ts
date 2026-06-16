import { NextRequest, NextResponse } from 'next/server';
import { makeSessionToken, passwordMatches, setSessionCookie } from '@/lib/auth';
import { noStoreJsonHeaders, sameOriginOk } from '@/lib/http';
import { clientIp, hitRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  if (!sameOriginOk(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: noStoreJsonHeaders() });
  }

  const ip = clientIp(req.headers);
  if (hitRateLimit(`login:${ip}`, 8, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429, headers: noStoreJsonHeaders() });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const password = typeof body.password === 'string' ? body.password : '';

    if (!passwordMatches(password)) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401, headers: noStoreJsonHeaders() });
    }

    const res = NextResponse.json({ ok: true }, { headers: noStoreJsonHeaders() });
    setSessionCookie(res, makeSessionToken());
    return res;
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500, headers: noStoreJsonHeaders() });
  }
}
