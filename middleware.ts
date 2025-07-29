import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple middleware for clean starter - no authentication required
export function middleware(request: NextRequest) {
  // For now, just pass through all requests
  // In a real app, you would add authentication logic here
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
  runtime: 'nodejs'
};