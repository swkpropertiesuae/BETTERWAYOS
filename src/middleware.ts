import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = [
  '/login',
  '/api/health',
  '/api/v1/auth/login',
  '/api/v1/auth/demo-switch',
  '/api/v1/intake/',
  '/api/v1/public/',
  '/api/v1/attendance/hikvision',
  '/manifest.webmanifest',
  '/favicon',
  '/brand/',
  '/banks/',
  '/staff/',
  '/images/',
  '/projects/',
  '/_next/',
];

function base64UrlToUint8Array(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (str.length % 4)) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function verifyEdgeSessionCookie(token: string): Promise<{ userId: string; role: string; exp?: number } | null> {
  if (!token || !token.includes('.')) return null;
  const [encoded, sig] = token.split('.');
  if (!encoded || !sig) return null;

  const secret =
    process.env.BW_SESSION_SECRET?.trim() ||
    (process.env.NODE_ENV === 'production' ? '' : 'dev-betterway-session-secret-change-in-prod');
  if (!secret) return null;

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const sigBytes = base64UrlToUint8Array(sig);
    const ok = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes.buffer as ArrayBuffer,
      new TextEncoder().encode(encoded),
    );
    if (!ok) return null;

    const payloadBytes = base64UrlToUint8Array(encoded);
    const parsed = JSON.parse(new TextDecoder().decode(payloadBytes)) as {
      userId?: string;
      role?: string;
      exp?: number;
    };
    if (!parsed.userId || !parsed.role) return null;
    if (parsed.exp && parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return { userId: parsed.userId, role: parsed.role, exp: parsed.exp };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === '/') {
    const raw = req.cookies.get('bw_os_session')?.value;
    const valid = raw ? await verifyEdgeSessionCookie(raw) : null;
    return NextResponse.redirect(new URL(valid ? '/os' : '/login', req.url));
  }

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const raw = req.cookies.get('bw_os_session')?.value;
  const session = raw ? await verifyEdgeSessionCookie(raw) : null;
  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (pathname.startsWith('/os/executive') || pathname.startsWith('/api/v1/executive')) {
    if (session.role !== 'OWNER') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'OWNER_ONLY: Restricted to Warda Kapadia & Shabib Siraj' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/os', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
