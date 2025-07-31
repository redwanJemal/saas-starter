// app/api/auth/admin/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUser();
    
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      data: {
        id: adminUser.id,
        email: adminUser.email,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        userType: adminUser.userType,
        roles: adminUser.roles,
        tenantId: adminUser.tenantId,
      }
    });
  } catch (error) {
    console.error('Error getting admin user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}