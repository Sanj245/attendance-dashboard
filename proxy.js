import { NextResponse } from 'next/server';

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('session_token')?.value;

  // Exclude static Next.js assets and authentication APIs
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isStaticFile = pathname.startsWith('/_next') || pathname.startsWith('/favicon.ico') || pathname.endsWith('.png') || pathname.endsWith('.jpg');
  const isApiAuth = pathname.startsWith('/api/auth');

  if (isStaticFile || isApiAuth) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users trying to access dashboard pages to /login
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated users trying to access login/signup portals back to dashboard
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Config to apply proxy across all pages except static/auth files
export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
