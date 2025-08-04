// app/api/admin/packages/[id]/bin-assignment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { 
  packages, 
  packageBinAssignments, 
  binLocations,
  customerProfiles,
  users 
} from '@/lib/db/schema';
import { eq, isNull, and } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth/admin';
import { RouteContext } from '@/lib/utils/route';

// Get package info and bin assignment history
export async function GET(
  request: NextRequest,
  RouteContext: RouteContext<{ id: string }>
) {
  try {
    // Check permission
    await requirePermission('packages.read');
    
    const packageId = (await RouteContext.params).id;

    // Get package info with current bin assignment
    const packageQuery = await db
      .select({
        id: packages.id,
        internalId: packages.internalId,
        description: packages.description,
        weightActualKg: packages.weightActualKg,
        status: packages.status,
        warehouseId: packages.warehouseId,
        customerName: users.firstName,
        customerId: customerProfiles.customerId,
        // Current bin assignment
        currentBinId: packageBinAssignments.binId,
        currentBinCode: binLocations.binCode,
        currentZoneName: binLocations.zoneName,
        currentAssignedAt: packageBinAssignments.assignedAt,
        currentAssignmentReason: packageBinAssignments.assignmentReason,
      })
      .from(packages)
      .innerJoin(customerProfiles, eq(packages.customerProfileId, customerProfiles.id))
      .innerJoin(users, eq(customerProfiles.userId, users.id))
      .leftJoin(
        packageBinAssignments, 
        and(
          eq(packageBinAssignments.packageId, packages.id),
          isNull(packageBinAssignments.removedAt)
        )
      )
      .leftJoin(binLocations, eq(packageBinAssignments.binId, binLocations.id))
      .where(eq(packages.id, packageId))
      .limit(1);

    if (packageQuery.length === 0) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    const packageData = packageQuery[0];

    // Get assignment history
    const assignmentHistory = await db
      .select({
        id: packageBinAssignments.id,
        binCode: binLocations.binCode,
        zoneName: binLocations.zoneName,
        assignedAt: packageBinAssignments.assignedAt,
        removedAt: packageBinAssignments.removedAt,
        assignmentReason: packageBinAssignments.assignmentReason,
        removalReason: packageBinAssignments.removalReason,
        notes: packageBinAssignments.notes,
        assignedByName: users.firstName,
        // TODO: Add removedByName when implementing user joins for removedBy
      })
      .from(packageBinAssignments)
      .innerJoin(binLocations, eq(packageBinAssignments.binId, binLocations.id))
      .leftJoin(users, eq(packageBinAssignments.assignedBy, users.id))
      .where(eq(packageBinAssignments.packageId, packageId))
      .orderBy(packageBinAssignments.assignedAt);

    // Format response
    const formattedPackage = {
      id: packageData.id,
      internalId: packageData.internalId,
      description: packageData.description,
      weightActualKg: packageData.weightActualKg ? parseFloat(packageData.weightActualKg) : 0,
      status: packageData.status,
      warehouseId: packageData.warehouseId,
      customerName: packageData.customerName,
      customerId: packageData.customerId,
      currentBinLocation: packageData.currentBinId ? {
        id: packageData.currentBinId,
        binCode: packageData.currentBinCode,
        zoneName: packageData.currentZoneName,
        assignedAt: packageData.currentAssignedAt?.toISOString(),
        assignmentReason: packageData.currentAssignmentReason,
      } : null,
    };

    const formattedHistory = assignmentHistory.map(h => ({
      id: h.id,
      binCode: h.binCode,
      zoneName: h.zoneName,
      assignedAt: h.assignedAt.toISOString(),
      removedAt: h.removedAt?.toISOString(),
      assignmentReason: h.assignmentReason,
      removalReason: h.removalReason,
      notes: h.notes,
      assignedByName: h.assignedByName,
    }));

    return NextResponse.json({
      package: formattedPackage,
      assignmentHistory: formattedHistory,
    });

  } catch (error) {
    console.error('Error fetching package bin assignment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch package bin assignment' },
      { status: 500 }
    );
  }
}

// Assign package to bin location
export async function POST(
  request: NextRequest,
  RouteContext: RouteContext<{ id: string }>
) {
  try {
    // Check permission
    const adminUser = await requirePermission('packages.manage');
    
    const packageId = (await RouteContext.params).id;
    const body = await request.json();
    const { binId, assignmentReason, notes } = body;

    if (!binId) {
      return NextResponse.json(
        { error: 'Bin location ID is required' },
        { status: 400 }
      );
    }

    // Check if package exists
    const [packageExists] = await db
      .select({ id: packages.id, warehouseId: packages.warehouseId })
      .from(packages)
      .where(eq(packages.id, packageId))
      .limit(1);

    if (!packageExists) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    // Check if bin location exists and has capacity
    const [binLocationData] = await db
      .select({
        id: binLocations.id,
        maxCapacity: binLocations.maxCapacity,
        currentOccupancy: binLocations.currentOccupancy,
        maxWeightKg: binLocations.maxWeightKg,
        warehouseId: binLocations.warehouseId,
        isActive: binLocations.isActive,
      })
      .from(binLocations)
      .where(eq(binLocations.id, binId))
      .limit(1);

    if (!binLocationData) {
      return NextResponse.json(
        { error: 'Bin location not found' },
        { status: 404 }
      );
    }

    if (!binLocationData.isActive) {
      return NextResponse.json(
        { error: 'Bin location is not active' },
        { status: 400 }
      );
    }

    if (binLocationData.warehouseId !== packageExists.warehouseId) {
      return NextResponse.json(
        { error: 'Bin location is not in the same warehouse as the package' },
        { status: 400 }
      );
    }

    // if (binLocationData.currentOccupancy >= binLocationData.maxCapacity) {
    //   return NextResponse.json(
    //     { error: 'Bin location is at full capacity' },
    //     { status: 400 }
    //   );
    // }

    // Check if package already has an active bin assignment
    const [existingAssignment] = await db
      .select({ id: packageBinAssignments.id })
      .from(packageBinAssignments)
      .where(
        and(
          eq(packageBinAssignments.packageId, packageId),
          isNull(packageBinAssignments.removedAt)
        )
      )
      .limit(1);

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'Package already has an active bin assignment. Remove it first.' },
        { status: 400 }
      );
    }

    // Create bin assignment
    const [newAssignment] = await db
      .insert(packageBinAssignments)
      .values({
        packageId: packageId,
        binId: binId,
        assignedAt: new Date(),
        assignedBy: adminUser.id,
        assignmentReason: assignmentReason || 'manual_assignment',
        notes: notes,
      })
      .returning();

    // Update bin occupancy
    // await db
    //   .update(binLocations)
    //   .set({
    //     currentOccupancy: binLocationData.currentOccupancy + 1,
    //     updatedAt: new Date(),
    //   })
    //   .where(eq(binLocations.id, binId));

    return NextResponse.json({
      assignment: newAssignment,
      message: 'Bin location assigned successfully',
    });

  } catch (error) {
    console.error('Error assigning bin location:', error);
    return NextResponse.json(
      { error: 'Failed to assign bin location' },
      { status: 500 }
    );
  }
}

// Remove bin assignment
export async function DELETE(
  request: NextRequest,
  RouteContext: RouteContext<{ id: string }>
) {
  try {
    // Check permission
    const adminUser = await requirePermission('packages.manage');
    
    const packageId = (await RouteContext.params).id;
    const body = await request.json();
    const { removalReason, notes } = body;

    // Get current active assignment
    const [currentAssignment] = await db
      .select({
        id: packageBinAssignments.id,
        binId: packageBinAssignments.binId,
      })
      .from(packageBinAssignments)
      .where(
        and(
          eq(packageBinAssignments.packageId, packageId),
          isNull(packageBinAssignments.removedAt)
        )
      )
      .limit(1);

    if (!currentAssignment) {
      return NextResponse.json(
        { error: 'No active bin assignment found for this package' },
        { status: 404 }
      );
    }

    // Remove assignment
    await db
      .update(packageBinAssignments)
      .set({
        removedAt: new Date(),
        removedBy: adminUser.id,
        removalReason: removalReason || 'manual_removal',
        notes: notes,
      })
      .where(eq(packageBinAssignments.id, currentAssignment.id));

    // Update bin occupancy
    const [binLocation] = await db
      .select({ currentOccupancy: binLocations.currentOccupancy })
      .from(binLocations)
      .where(eq(binLocations.id, currentAssignment.binId))
      .limit(1);

    if (binLocation) {
    //   await db
    //     .update(binLocations)
    //     .set({
    //       currentOccupancy: Math.max(0, binLocation.currentOccupancy - 1),
    //       updatedAt: new Date(),
    //     })
    //     .where(eq(binLocations.id, currentAssignment.binId));
    }

    return NextResponse.json({
      message: 'Bin assignment removed successfully',
    });

  } catch (error) {
    console.error('Error removing bin assignment:', error);
    return NextResponse.json(
      { error: 'Failed to remove bin assignment' },
      { status: 500 }
    );
  }
}