import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { customerProfiles, users, customerWarehouseAssignments, warehouses } from '@/lib/db/schema';
import { eq, ilike, or, sql, and } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('customers.read');

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    if (!query || query.length < 2) {
      return NextResponse.json({ customers: [] });
    }

    // Search customers by suite code, customer ID, name, or email
    const customers = await db
      .select({
        id: customerProfiles.id,
        customerId: customerProfiles.customerId,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        suiteCode: customerWarehouseAssignments.suiteCode,
        warehouseId: customerWarehouseAssignments.warehouseId,
        warehouseName: warehouses.name,
      })
      .from(customerProfiles)
      .innerJoin(users, eq(customerProfiles.userId, users.id))
      .innerJoin(customerWarehouseAssignments, eq(customerProfiles.id, customerWarehouseAssignments.customerProfileId))
      .innerJoin(warehouses, eq(customerWarehouseAssignments.warehouseId, warehouses.id))
      .where(
        and(
          or(
            ilike(customerProfiles.customerId, `%${query}%`),
            ilike(customerWarehouseAssignments.suiteCode, `%${query}%`),
            ilike(users.firstName, `%${query}%`),
            ilike(users.lastName, `%${query}%`),
            ilike(users.email, `%${query}%`),
            ilike(sql`${users.firstName} || ' ' || ${users.lastName}`, `%${query}%`)
          ),
          eq(customerWarehouseAssignments.status, 'active')
        )
      )
      .limit(10);

    return NextResponse.json({ customers });
  } catch (error) {
    console.error('Error searching customers:', error);
    return NextResponse.json(
      { error: 'Failed to search customers' },
      { status: 500 }
    );
  }
}