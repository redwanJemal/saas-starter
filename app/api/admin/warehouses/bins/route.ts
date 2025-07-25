// app/api/admin/warehouse/bins/route.ts

import { db } from '@/lib/db/drizzle';
import { binLocations, warehouses } from '@/lib/db/schema';
import { NextRequest, NextResponse } from 'next/server';
import { eq, and, like, desc, count } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
    const adminUser = await requirePermission ('admin.view');
    const { searchParams } = new URL(request.url);
    
    const warehouseId = searchParams.get('warehouseId');
    const search = searchParams.get('search');
    const zone = searchParams.get('zone');
    const available = searchParams.get('available') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build query conditions
    let conditions = [eq(binLocations.tenantId, adminUser.tenantId)];
    
    if (warehouseId) {
      conditions.push(eq(binLocations.warehouseId, warehouseId));
    }
    
    if (search) {
      conditions.push(like(binLocations.binCode, `%${search}%`));
    }
    
    if (zone) {
      conditions.push(like(binLocations.zoneName, `%${zone}%`));
    }
    
    if (available) {
      // Show only bins that have available capacity
      conditions.push(
        // currentOccupancy < maxCapacity (or maxCapacity is null)
      );
    }

    // Get bins with warehouse information
    const binsQuery = await db
      .select({
        id: binLocations.id,
        binCode: binLocations.binCode,
        zoneName: binLocations.zoneName,
        description: binLocations.description,
        maxCapacity: binLocations.maxCapacity,
        currentOccupancy: binLocations.currentOccupancy,
        maxWeightKg: binLocations.maxWeightKg,
        dailyPremium: binLocations.dailyPremium,
        currency: binLocations.currency,
        isClimateControlled: binLocations.isClimateControlled,
        isSecured: binLocations.isSecured,
        isAccessible: binLocations.isAccessible,
        isActive: binLocations.isActive,
        warehouseId: binLocations.warehouseId,
        warehouseName: warehouses.name,
        createdAt: binLocations.createdAt,
        updatedAt: binLocations.updatedAt,
      })
      .from(binLocations)
      .leftJoin(warehouses, eq(binLocations.warehouseId, warehouses.id))
      .where(and(...conditions))
      .orderBy(desc(binLocations.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalQuery = await db
      .select({ count: count() })
      .from(binLocations)
      .where(and(...conditions));

    const totalItems = totalQuery[0].count;
    const totalPages = Math.ceil(totalItems / limit);

    return NextResponse.json({
      bins: binsQuery.map(bin => ({
        ...bin,
        maxCapacity: bin.maxCapacity || 0,
        currentOccupancy: bin.currentOccupancy || 0,
        maxWeightKg: bin.maxWeightKg ? parseFloat(bin.maxWeightKg) : null,
        dailyPremium: parseFloat(bin.dailyPremium || '0'),
        availableCapacity: (bin.maxCapacity || 0) - (bin.currentOccupancy || 0),
        utilizationPercent: bin.maxCapacity 
          ? Math.round(((bin.currentOccupancy || 0) / bin.maxCapacity) * 100)
          : 0
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
      },
    });

  } catch (error) {
    console.error('Error fetching bin locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bin locations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requirePermission('admin.create');
    const body = await request.json();
    
    const {
      warehouseId,
      binCode,
      zoneName,
      description,
      maxCapacity = 10,
      maxWeightKg,
      dailyPremium = 0,
      currency = 'USD',
      isClimateControlled = false,
      isSecured = false,
      isAccessible = true,
      isActive = true
    } = body;

    // Validate required fields
    if (!warehouseId || !binCode || !zoneName) {
      return NextResponse.json(
        { error: 'Warehouse ID, bin code, and zone name are required' },
        { status: 400 }
      );
    }

    // Verify warehouse belongs to tenant
    const warehouseQuery = await db
      .select()
      .from(warehouses)
      .where(
        and(
          eq(warehouses.id, warehouseId),
          eq(warehouses.tenantId, adminUser.tenantId)
        )
      )
      .limit(1);

    if (warehouseQuery.length === 0) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 400 }
      );
    }

    // Check if bin code already exists in this warehouse
    const existingBinQuery = await db
      .select()
      .from(binLocations)
      .where(
        and(
          eq(binLocations.warehouseId, warehouseId),
          eq(binLocations.binCode, binCode),
          eq(binLocations.tenantId, adminUser.tenantId)
        )
      )
      .limit(1);

    if (existingBinQuery.length > 0) {
      return NextResponse.json(
        { error: 'Bin code already exists in this warehouse' },
        { status: 400 }
      );
    }

    // Create new bin location
    const [newBin] = await db
      .insert(binLocations)
      .values({
        tenantId: adminUser.tenantId,
        warehouseId,
        binCode: binCode.toUpperCase(),
        zoneName,
        description,
        maxCapacity,
        currentOccupancy: 0,
        maxWeightKg: maxWeightKg?.toString(),
        dailyPremium: dailyPremium.toString(),
        currency,
        isClimateControlled,
        isSecured,
        isAccessible,
        isActive
      })
      .returning();

    return NextResponse.json({
      message: 'Bin location created successfully',
      bin: {
        ...newBin,
        maxCapacity: newBin.maxCapacity || 0,
        currentOccupancy: newBin.currentOccupancy || 0,
        maxWeightKg: newBin.maxWeightKg ? parseFloat(newBin.maxWeightKg) : null,
        dailyPremium: parseFloat(newBin.dailyPremium || '0'),
        availableCapacity: (newBin.maxCapacity || 0) - (newBin.currentOccupancy || 0)
      }
    });

  } catch (error) {
    console.error('Error creating bin location:', error);
    return NextResponse.json(
      { error: 'Failed to create bin location' },
      { status: 500 }
    );
  }
}

// app/api/admin/warehouse/bins/[id]/route.ts

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await requirePermission('admin.update');
    const binId = params.id;
    const body = await request.json();
    
    const {
      binCode,
      zoneName,
      description,
      maxCapacity,
      maxWeightKg,
      dailyPremium,
      currency,
      isClimateControlled,
      isSecured,
      isAccessible,
      isActive
    } = body;

    // Verify bin belongs to tenant
    const existingBinQuery = await db
      .select()
      .from(binLocations)
      .where(
        and(
          eq(binLocations.id, binId),
          eq(binLocations.tenantId, adminUser.tenantId)
        )
      )
      .limit(1);

    if (existingBinQuery.length === 0) {
      return NextResponse.json(
        { error: 'Bin location not found' },
        { status: 404 }
      );
    }

    const existingBin = existingBinQuery[0];

    // If bin code is changing, check for duplicates
    if (binCode && binCode !== existingBin.binCode) {
      const duplicateQuery = await db
        .select()
        .from(binLocations)
        .where(
          and(
            eq(binLocations.warehouseId, existingBin.warehouseId),
            eq(binLocations.binCode, binCode.toUpperCase()),
            eq(binLocations.tenantId, adminUser.tenantId)
          )
        )
        .limit(1);

      if (duplicateQuery.length > 0) {
        return NextResponse.json(
          { error: 'Bin code already exists in this warehouse' },
          { status: 400 }
        );
      }
    }

    // Validate max capacity doesn't go below current occupancy
    if (maxCapacity !== undefined && maxCapacity < (existingBin.currentOccupancy || 0)) {
      return NextResponse.json(
        { error: 'Max capacity cannot be less than current occupancy' },
        { status: 400 }
      );
    }

    // Update bin location
    const updateData: any = {
      updatedAt: new Date()
    };

    if (binCode) updateData.binCode = binCode.toUpperCase();
    if (zoneName) updateData.zoneName = zoneName;
    if (description !== undefined) updateData.description = description;
    if (maxCapacity !== undefined) updateData.maxCapacity = maxCapacity;
    if (maxWeightKg !== undefined) updateData.maxWeightKg = maxWeightKg?.toString();
    if (dailyPremium !== undefined) updateData.dailyPremium = dailyPremium.toString();
    if (currency) updateData.currency = currency;
    if (isClimateControlled !== undefined) updateData.isClimateControlled = isClimateControlled;
    if (isSecured !== undefined) updateData.isSecured = isSecured;
    if (isAccessible !== undefined) updateData.isAccessible = isAccessible;
    if (isActive !== undefined) updateData.isActive = isActive;

    const [updatedBin] = await db
      .update(binLocations)
      .set(updateData)
      .where(eq(binLocations.id, binId))
      .returning();

    return NextResponse.json({
      message: 'Bin location updated successfully',
      bin: {
        ...updatedBin,
        maxCapacity: updatedBin.maxCapacity || 0,
        currentOccupancy: updatedBin.currentOccupancy || 0,
        maxWeightKg: updatedBin.maxWeightKg ? parseFloat(updatedBin.maxWeightKg) : null,
        dailyPremium: parseFloat(updatedBin.dailyPremium || '0'),
        availableCapacity: (updatedBin.maxCapacity || 0) - (updatedBin.currentOccupancy || 0)
      }
    });

  } catch (error) {
    console.error('Error updating bin location:', error);
    return NextResponse.json(
      { error: 'Failed to update bin location' },
      { status: 500 }
    );
  }
}