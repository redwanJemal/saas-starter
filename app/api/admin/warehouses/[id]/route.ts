// app/api/admin/warehouses/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { warehouses, packages, shipments } from '@/lib/db/schema';
import { eq, sql, count } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth/admin';
import { RouteContext } from '@/lib/utils/route';

export async function GET(
  request: NextRequest,
  RouteContext: RouteContext<{ id: string }>
) {
  try {
    // Check permission
    await requirePermission('warehouses.manage');

    const warehouseId = (await RouteContext.params).id;

    // Get warehouse details
    const [warehouse] = await db
      .select()
      .from(warehouses)
      .where(eq(warehouses.id, warehouseId))
      .limit(1);

    if (!warehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      );
    }

    // Get package stats
    const [packageStats] = await db
      .select({
        totalPackages: count(),
        pendingPackages: sql<number>`COUNT(CASE WHEN status IN ('received', 'processing') THEN 1 END)`,
        readyPackages: sql<number>`COUNT(CASE WHEN status = 'ready_to_ship' THEN 1 END)`,
      })
      .from(packages)
      .where(eq(packages.warehouseId, warehouseId));

    // Get shipment stats
    const [shipmentStats] = await db
      .select({
        totalShipments: count(),
        activeShipments: sql<number>`COUNT(CASE WHEN status IN ('processing', 'dispatched', 'in_transit') THEN 1 END)`,
      })
      .from(shipments)
      .where(eq(shipments.warehouseId, warehouseId));

    // Combine warehouse data with stats
    const warehouseWithStats = {
      ...warehouse,
      stats: {
        totalPackages: packageStats?.totalPackages || 0,
        pendingPackages: packageStats?.pendingPackages || 0,
        readyPackages: packageStats?.readyPackages || 0,
        totalShipments: shipmentStats?.totalShipments || 0,
        activeShipments: shipmentStats?.activeShipments || 0,
      }
    };

    return NextResponse.json(warehouseWithStats);
  } catch (error) {
    console.error('Error fetching warehouse details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warehouse details' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  RouteContext: RouteContext<{ id: string }>
) {
  try {
    // Check permission
    await requirePermission('warehouses.manage');

    const warehouseId = (await RouteContext.params).id;
    const body = await request.json();

    // Check if warehouse exists
    const [existingWarehouse] = await db
      .select({ id: warehouses.id, code: warehouses.code })
      .from(warehouses)
      .where(eq(warehouses.id, warehouseId))
      .limit(1);

    if (!existingWarehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      );
    }

    // If code is being updated, check for duplicates
    if (body.code && body.code !== existingWarehouse.code) {
      const [duplicateWarehouse] = await db
        .select({ id: warehouses.id })
        .from(warehouses)
        .where(eq(warehouses.code, body.code))
        .limit(1);

      if (duplicateWarehouse) {
        return NextResponse.json(
          { error: 'Warehouse code already exists' },
          { status: 400 }
        );
      }
    }

    // Update warehouse
    const [updatedWarehouse] = await db
      .update(warehouses)
      .set({
        ...body,
        code: body.code?.toUpperCase(),
        updatedAt: sql`now()`,
      })
      .where(eq(warehouses.id, warehouseId))
      .returning();

    return NextResponse.json(updatedWarehouse);
  } catch (error) {
    console.error('Error updating warehouse:', error);
    return NextResponse.json(
      { error: 'Failed to update warehouse' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  RouteContext: RouteContext<{ id: string }>
) {
  try {
    // Check permission
    await requirePermission('warehouses.manage');

    const warehouseId = (await RouteContext.params).id;

    // Check if warehouse has packages or shipments
    const [packageCount] = await db
      .select({ count: count() })
      .from(packages)
      .where(eq(packages.warehouseId, warehouseId));

    const [shipmentCount] = await db
      .select({ count: count() })
      .from(shipments)
      .where(eq(shipments.warehouseId, warehouseId));

    if ((packageCount?.count || 0) > 0 || (shipmentCount?.count || 0) > 0) {
      return NextResponse.json(
        { error: 'Cannot delete warehouse with existing packages or shipments' },
        { status: 400 }
      );
    }

    // Delete warehouse
    const [deletedWarehouse] = await db
      .delete(warehouses)
      .where(eq(warehouses.id, warehouseId))
      .returning();

    if (!deletedWarehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Warehouse deleted successfully' });
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    return NextResponse.json(
      { error: 'Failed to delete warehouse' },
      { status: 500 }
    );
  }
}