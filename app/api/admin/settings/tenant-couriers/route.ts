// app/api/admin/settings/tenant-couriers/route.ts
import { tenantCouriers, couriers } from '@/features/settings/db/schema';
import type { CreateTenantCourierData } from '@/features/settings/types/settings.types';
import { requirePermission } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const adminUser = await requirePermission('admin.manage');

    // Get tenant couriers with courier details
    const tenantCouriersList = await db
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
      .where(eq(tenantCouriers.tenantId, adminUser.tenantId))
      .orderBy(couriers.name);

    return NextResponse.json({ data: tenantCouriersList });

  } catch (error) {
    console.error('Error fetching tenant couriers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenant couriers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requirePermission('admin.manage');

    const body = await request.json();
    const data: CreateTenantCourierData = {
      courierId: body.courierId,
      isActive: body.isActive ?? true,
      contractDetails: body.contractDetails,
      apiCredentials: body.apiCredentials ? JSON.stringify(body.apiCredentials) : undefined,
    };

    // Check if courier already exists for this tenant
    const existingTenantCourier = await db
      .select()
      .from(tenantCouriers)
      .where(
        and(
          eq(tenantCouriers.tenantId, adminUser.tenantId),
          eq(tenantCouriers.courierId, data.courierId)
        )
      )
      .limit(1);

    if (existingTenantCourier.length > 0) {
      return NextResponse.json(
        { error: 'Courier already configured for this tenant' },
        { status: 400 }
      );
    }

    const [newTenantCourier] = await db
      .insert(tenantCouriers)
      .values({
        tenantId: adminUser.tenantId,
        courierId: data.courierId,
        isActive: data.isActive,
        contractDetails: data.contractDetails,
        apiCredentials: data.apiCredentials,
      })
      .returning();

    return NextResponse.json({ data: newTenantCourier }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating tenant courier:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create tenant courier' },
      { status: 400 }
    );
  }
}