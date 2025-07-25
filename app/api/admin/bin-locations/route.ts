// app/api/admin/bin-locations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { binLocations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('warehouses.read');
    
    const searchParams = request.nextUrl.searchParams;
    const warehouseId = searchParams.get('warehouseId');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    if (!warehouseId) {
      return NextResponse.json(
        { error: 'Warehouse ID is required' },
        { status: 400 }
      );
    }

    // Build where conditions
    let whereConditions = [eq(binLocations.warehouseId, warehouseId)];
    
    if (!includeInactive) {
      whereConditions.push(eq(binLocations.isActive, true));
    }

    // Get bin locations
    const binLocationsList = await db
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
        createdAt: binLocations.createdAt,
        updatedAt: binLocations.updatedAt,
      })
      .from(binLocations)
      .where(and(...whereConditions))
      .orderBy(binLocations.zoneName, binLocations.binCode);

    // Format response
    const formattedBinLocations = binLocationsList.map(bin => ({
      id: bin.id,
      binCode: bin.binCode,
      zoneName: bin.zoneName,
      description: bin.description,
      maxCapacity: bin.maxCapacity,
      currentOccupancy: bin.currentOccupancy,
      maxWeightKg: bin.maxWeightKg ? parseFloat(bin.maxWeightKg) : null,
      dailyPremium: bin.dailyPremium ? parseFloat(bin.dailyPremium) : 0,
      currency: bin.currency,
      isClimateControlled: bin.isClimateControlled,
      isSecured: bin.isSecured,
      isAccessible: bin.isAccessible,
      isActive: bin.isActive,
      createdAt: bin.createdAt.toISOString(),
      updatedAt: bin.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      binLocations: formattedBinLocations,
    });

  } catch (error) {
    console.error('Error fetching bin locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bin locations' },
      { status: 500 }
    );
  }
}