import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for login pages and static files
  if (
    pathname.startsWith('/admin/login') ||
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Check if this is an admin route
  if (pathname.startsWith('/admin')) {
    const sessionCookie = request.cookies.get('session');
    
    if (!sessionCookie?.value) {
      return NextResponse.redirect(
        new URL(`/admin/login?redirect=${encodeURIComponent(pathname)}`, request.url)
      );
    }

    try {
      const sessionData = await verifyToken(sessionCookie.value);
      
      if (!sessionData || !sessionData.user) {
        return NextResponse.redirect(
          new URL(`/admin/login?redirect=${encodeURIComponent(pathname)}`, request.url)
        );
      }

      // Check if session is expired
      if (new Date(sessionData.expires) < new Date()) {
        return NextResponse.redirect(
          new URL(`/admin/login?redirect=${encodeURIComponent(pathname)}`, request.url)
        );
      }

      // TODO: Add admin/staff user type check here
      // This would require querying the database to check userType
      // For now, we'll let the layout components handle the admin check

    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.redirect(
        new URL(`/admin/login?redirect=${encodeURIComponent(pathname)}`, request.url)
      );
    }
  }

  // Check customer routes (existing logic)
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/packages')) {
    const sessionCookie = request.cookies.get('session');
    
    if (!sessionCookie?.value) {
      return NextResponse.redirect(
        new URL(`/sign-in?redirect=${encodeURIComponent(pathname)}`, request.url)
      );
    }

    try {
      const sessionData = await verifyToken(sessionCookie.value);
      
      if (!sessionData || !sessionData.user) {
        return NextResponse.redirect(
          new URL(`/sign-in?redirect=${encodeURIComponent(pathname)}`, request.url)
        );
      }

      if (new Date(sessionData.expires) < new Date()) {
        return NextResponse.redirect(
          new URL(`/sign-in?redirect=${encodeURIComponent(pathname)}`, request.url)
        );
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.redirect(
        new URL(`/sign-in?redirect=${encodeURIComponent(pathname)}`, request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
  runtime: 'nodejs'
};