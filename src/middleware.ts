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

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === '/') {
    const cookie = req.cookies.get('bw_os_session')?.value;
    return NextResponse.redirect(new URL(cookie ? '/os' : '/login', req.url));
  }

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const session = req.cookies.get('bw_os_session')?.value;
  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Decode payload role hint for fast edge redirect on /os/executive (full HMAC verification runs server-side in every API & page)
  if (pathname.startsWith('/os/executive') || pathname.startsWith('/api/v1/executive')) {
    try {
      const encoded = session.split('.')[0];
      const json = JSON.parse(atob(encoded.replace(/-/g, '+').replace(/_/g, '/')));
      if (json.role !== 'OWNER') {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'OWNER_ONLY: Restricted to Warda Kapadia & Shabib Siraj' }, { status: 403 });
        }
        return NextResponse.redirect(new URL('/os', req.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
