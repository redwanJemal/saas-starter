// app/api/admin/customers/search/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/admin';
import { searchCustomersForAdmin } from '@/features/customers/db/queries';

// GET /api/admin/customers/search - Search customers for admin with minimal data
export async function GET(request: NextRequest) {
  try {
    const adminUser = await requirePermission('customers.read');
    const { searchParams } = new URL(request.url);
    
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: true,
        customers: [],
        message: 'Query must be at least 2 characters'
      });
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    const customers = await searchCustomersForAdmin(
      adminUser.tenantId,
      query.trim(),
      limit
    );

    return NextResponse.json({
      success: true,
      data: customers
    });

  } catch (error) {
    console.error('Error searching customers:', error);
    return NextResponse.json(
      { error: 'Failed to search customers' },
      { status: 500 }
    );
  }
}