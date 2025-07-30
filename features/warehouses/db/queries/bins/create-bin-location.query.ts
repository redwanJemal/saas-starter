// features/warehouses/db/queries/bins/create-bin-location.query.ts
import { db } from '@/lib/db';
import { binLocations, warehouses } from '@/features/warehouses/db/schema';
import { eq, and } from 'drizzle-orm';
import type { CreateBinLocationData, BinLocation } from '@/features/warehouses/db/schema';

export async function createBinLocation(
  tenantId: string,
  data: CreateBinLocationData
): Promise<BinLocation> {
  // Validate warehouse exists and belongs to tenant
  const warehouseExists = await db
    .select({ id: warehouses.id })
    .from(warehouses)
    .where(and(
      eq(warehouses.id, data.warehouseId),
      eq(warehouses.tenantId, tenantId)
    ))
    .limit(1);

  if (warehouseExists.length === 0) {
    throw new Error('Warehouse not found');
  }

  // Check if bin code already exists in this warehouse
  const existingBin = await db
    .select({ id: binLocations.id })
    .from(binLocations)
    .where(and(
      eq(binLocations.warehouseId, data.warehouseId),
      eq(binLocations.binCode, data.binCode)
    ))
    .limit(1);

  if (existingBin.length > 0) {
    throw new Error('Bin code already exists in this warehouse');
  }

  // Create new bin location
  const newBinData = {
    tenantId,
    warehouseId: data.warehouseId,
    binCode: data.binCode,
    zoneName: data.zoneName,
    description: data.description || null,
    maxCapacity: data.maxCapacity || null,
    maxWeightKg: data.maxWeightKg || null,
    dailyPremium: data.dailyPremium || '0.00',
    currency: data.currency || 'USD',
    isClimateControlled: data.isClimateControlled || false,
    isSecured: data.isSecured || false,
    isAccessible: data.isAccessible || true,
    isActive: true,
    isAvailable: true,
  };

  const [newBin] = await db
    .insert(binLocations)
    .values(newBinData)
    .returning();

  return newBin;
}