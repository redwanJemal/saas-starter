import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { signToken, verifyToken } from '@/lib/auth/session';

const protectedRoutes = '/dashboard';
const adminRoutes = '/admin';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session');
  
  const isProtectedRoute = pathname.startsWith(protectedRoutes);
  const isAdminRoute = pathname.startsWith(adminRoutes);

  // Check if user is authenticated for protected routes
  if ((isProtectedRoute || isAdminRoute) && !sessionCookie) {
    const redirectUrl = isAdminRoute ? '/sign-in?redirect=/admin' : '/sign-in';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  let res = NextResponse.next();

  if (sessionCookie && request.method === 'GET') {
    try {
      const parsed = await verifyToken(sessionCookie.value);
      
      // Check user type for admin routes
      if (isAdminRoute && parsed.user) {
        // We can't easily get user type from the session token without a DB call
        // For now, we'll let the request through and handle authorization in the components
        // In production, you might want to include user type in the JWT or make a quick DB check
      }

      const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
      res.cookies.set({
        name: 'session',
        value: await signToken({
          ...parsed,
          expires: expiresInOneDay.toISOString()
        }),
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        expires: expiresInOneDay
      });
    } catch (error) {
      console.error('Error updating session:', error);
      res.cookies.delete('session');
      if (isProtectedRoute || isAdminRoute) {
        const redirectUrl = isAdminRoute ? '/sign-in?redirect=/admin' : '/sign-in';
        return NextResponse.redirect(new URL(redirectUrl, request.url));
      }
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
  runtime: 'nodejs'
};