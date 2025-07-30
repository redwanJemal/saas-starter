// app/api/admin/settings/tenant-couriers/[id]/route.ts
import type { UpdateTenantCourierData } from '@/features/settings/types/settings.types';
import { requirePermission } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { tenantCouriers, couriers } from '@/lib/db/schema';
import { RouteContext } from '@/lib/types/route';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const adminUser = await requirePermission('admin.manage');
    const { id } = await context.params;

    const tenantCourier = await db
      .select({
        id: tenantCouriers.id,
        tenantId: tenantCouriers.tenantId,
        courierId: tenantCouriers.courierId,
        isActive: tenantCouriers.isActive,
        contractDetails: tenantCouriers.contractDetails,
        apiCredentials: tenantCouriers.apiCredentials,
        updatedAt: tenantCouriers.updatedAt,
        courier: {
          code: couriers.code,
          name: couriers.name,
          website: couriers.website,
          trackingUrlTemplate: couriers.trackingUrlTemplate,
        }
      })
      .from(tenantCouriers)
      .innerJoin(couriers, eq(tenantCouriers.courierId, couriers.id))
      .where(
        and(
          eq(tenantCouriers.id, id),
          eq(tenantCouriers.tenantId, adminUser.tenantId)
        )
      )
      .limit(1);

    if (tenantCourier.length === 0) {
      return NextResponse.json(
        { error: 'Tenant courier not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: tenantCourier[0] });

  } catch (error) {
    console.error('Error fetching tenant courier:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenant courier' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const adminUser = await requirePermission('admin.manage');
    const { id } = await context.params;
    const body = await request.json();
    
    const data: UpdateTenantCourierData = {
      isActive: body.isActive,
      contractDetails: body.contractDetails,
      apiCredentials: body.apiCredentials ? JSON.stringify(body.apiCredentials) : undefined,
    };

    const [updatedTenantCourier] = await db
      .update(tenantCouriers)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(tenantCouriers.id, id),
          eq(tenantCouriers.tenantId, adminUser.tenantId)
        )
      )
      .returning();

    if (!updatedTenantCourier) {
      return NextResponse.json(
        { error: 'Tenant courier not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: updatedTenantCourier });

  } catch (error: any) {
    console.error('Error updating tenant courier:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update tenant courier' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const adminUser = await requirePermission('admin.manage');
    const { id } = await context.params;

    const result = await db
      .delete(tenantCouriers)
      .where(
        and(
          eq(tenantCouriers.id, id),
          eq(tenantCouriers.tenantId, adminUser.tenantId)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Tenant courier not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error deleting tenant courier:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete tenant courier' },
      { status: 400 }
    );
  }
}