// features/warehouses/db/queries/bins/update-bin-location.query.ts
import { db } from '@/lib/db';
import { binLocations } from '@/features/warehouses/db/schema';
import { eq, and } from 'drizzle-orm';
import type { UpdateBinLocationData, BinLocation } from '@/features/warehouses/db/schema';

export async function updateBinLocation(
  id: string,
  data: UpdateBinLocationData
): Promise<BinLocation | null> {
  // Check if bin exists
  const existingBin = await db
    .select()
    .from(binLocations)
    .where(eq(binLocations.id, id))
    .limit(1);

  if (existingBin.length === 0) {
    return null;
  }

  // If updating bin code, check for duplicates
  if (data.binCode && data.binCode !== existingBin[0].binCode) {
    const duplicateBin = await db
      .select({ id: binLocations.id })
      .from(binLocations)
      .where(and(
        eq(binLocations.warehouseId, existingBin[0].warehouseId),
        eq(binLocations.binCode, data.binCode)
      ))
      .limit(1);

    if (duplicateBin.length > 0) {
      throw new Error('Bin code already exists in this warehouse');
    }
  }

  // Prepare update data
  const updateData: any = {
    updatedAt: new Date(),
  };

  // Only update fields that are provided
  if (data.binCode !== undefined) updateData.binCode = data.binCode;
  if (data.zoneName !== undefined) updateData.zoneName = data.zoneName;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.maxCapacity !== undefined) updateData.maxCapacity = data.maxCapacity;
  if (data.maxWeightKg !== undefined) updateData.maxWeightKg = data.maxWeightKg;
  if (data.dailyPremium !== undefined) updateData.dailyPremium = data.dailyPremium;
  if (data.currency !== undefined) updateData.currency = data.currency;
  if (data.isClimateControlled !== undefined) updateData.isClimateControlled = data.isClimateControlled;
  if (data.isSecured !== undefined) updateData.isSecured = data.isSecured;
  if (data.isAccessible !== undefined) updateData.isAccessible = data.isAccessible;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  // Update bin location
  const [updatedBin] = await db
    .update(binLocations)
    .set(updateData)
    .where(eq(binLocations.id, id))
    .returning();

  return updatedBin;
}
