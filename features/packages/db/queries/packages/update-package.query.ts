// features/packages/db/queries/packages/update-package.query.ts

import { db } from '@/lib/db';
import { 
  packages, 
  packageStatusHistory, 
  type Package,
  type PackageStatus 
} from '@/features/packages/db/schema';
import { eq } from 'drizzle-orm';

export interface UpdatePackageData {
  customerProfileId?: string;
  suiteCodeCaptured?: string;
  internalId?: string;
  trackingNumberInbound?: string;
  trackingNumberOutbound?: string;
  
  // Package details
  description?: string;
  estimatedValue?: number;
  estimatedValueCurrency?: string;
  
  // Physical characteristics
  weightKg?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  volumetricWeightKg?: number;
  chargeableWeightKg?: number;
  
  // Status and dates
  status?: PackageStatus;
  expectedArrivalDate?: Date | string | null;
  receivedAt?: Date | string | null;
  readyToShipAt?: Date | string | null;
  storageExpiresAt?: Date | string | null;
  
  // Warehouse assignment
  warehouseId?: string;
  
  // Notes and instructions
  warehouseNotes?: string;
  customerNotes?: string;
  specialInstructions?: string;
  
  // Package characteristics
  isFragile?: boolean;
  isHighValue?: boolean;
  requiresAdultSignature?: boolean;
  isRestricted?: boolean;
  
  // Customs information
  customsDeclaration?: string;
  customsValue?: number;
  customsValueCurrency?: string;
  countryOfOrigin?: string;
  hsCode?: string;
  
  // Pre-receiving workflow
  incomingShipmentItemId?: string;
  
  // Processing info
  processedBy?: string;
  processedAt?: Date | string | null;
}

export async function updatePackage(
  id: string,
  data: UpdatePackageData,
  updatedBy?: string
): Promise<Package | null> {
  return await db.transaction(async (tx) => {
    // First, get the current package to compare status changes
    const [currentPackage] = await tx
      .select()
      .from(packages)
      .where(eq(packages.id, id))
      .limit(1);

    if (!currentPackage) {
      return null;
    }

    // Prepare update data with calculated fields
    const updateData: Partial<typeof packages.$inferInsert> = {
      updatedAt: new Date(),
    };

    // Only update fields that are provided
    if (data.customerProfileId !== undefined) updateData.customerProfileId = data.customerProfileId;
    if (data.internalId !== undefined) updateData.internalId = data.internalId;
    if (data.trackingNumberInbound !== undefined) updateData.trackingNumberInbound = data.trackingNumberInbound;
    if (data.trackingNumberOutbound !== undefined) updateData.trackingNumberOutbound = data.trackingNumberOutbound;
    
    // Package details
    if (data.description !== undefined) updateData.description = data.description;
    if (data.estimatedValue !== undefined) updateData.customsValue = data.estimatedValue ? String(data.estimatedValue) : null;
    if (data.estimatedValueCurrency !== undefined) updateData.customsValueCurrency = data.estimatedValueCurrency;
    
    // Physical characteristics
    if (data.weightKg !== undefined) updateData.weightKg = data.weightKg ? String(data.weightKg) : null;
    if (data.lengthCm !== undefined) updateData.lengthCm = data.lengthCm ? String(data.lengthCm) : null;
    if (data.widthCm !== undefined) updateData.widthCm = data.widthCm ? String(data.widthCm) : null;
    if (data.heightCm !== undefined) updateData.heightCm = data.heightCm ? String(data.heightCm) : null;
    
    // Recalculate volumetric weight if dimensions are updated
    const newLength = data.lengthCm ? Number(data.lengthCm) : Number(currentPackage.lengthCm);
    const newWidth = data.widthCm ? Number(data.widthCm) : Number(currentPackage.widthCm);
    const newHeight = data.heightCm ? Number(data.heightCm) : Number(currentPackage.heightCm);
    
    if (data.volumetricWeightKg !== undefined) {
      updateData.volumetricWeightKg = data.volumetricWeightKg ? String(data.volumetricWeightKg) : null;
    } else if (data.lengthCm !== undefined || data.widthCm !== undefined || data.heightCm !== undefined) {
      updateData.volumetricWeightKg = calculateVolumetricWeight(newLength, newWidth, newHeight);
    }
    
    // Recalculate chargeable weight if weight or dimensions are updated
    const newActualWeight = data.weightKg ? Number(data.weightKg) : Number(currentPackage.weightKg);
    const newVolumetricWeight = updateData.volumetricWeightKg ? Number(updateData.volumetricWeightKg) : Number(currentPackage.volumetricWeightKg);
    
    if (data.chargeableWeightKg !== undefined) {
      updateData.chargeableWeightKg = data.chargeableWeightKg ? String(data.chargeableWeightKg) : null;
    } else if (data.weightKg !== undefined || updateData.volumetricWeightKg !== undefined) {
      updateData.chargeableWeightKg = calculateChargeableWeight(newActualWeight, newVolumetricWeight) ? String(calculateChargeableWeight(newActualWeight, newVolumetricWeight)) : null;
    }
    
    // Status and dates
    if (data.status !== undefined) updateData.status = data.status;
    if (data.expectedArrivalDate !== undefined) {
      updateData.expectedArrivalDate = data.expectedArrivalDate ? new Date(data.expectedArrivalDate) : null;
    }
    if (data.receivedAt !== undefined) {
      updateData.receivedAt = data.receivedAt ? new Date(data.receivedAt) : null;
    }
    if (data.readyToShipAt !== undefined) {
      updateData.readyToShipAt = data.readyToShipAt ? new Date(data.readyToShipAt) : null;
    }
    if (data.storageExpiresAt !== undefined) {
      updateData.storageExpiresAt = data.storageExpiresAt ? new Date(data.storageExpiresAt) : null;
    }
    
    // Warehouse assignment
    if (data.warehouseId !== undefined) updateData.warehouseId = data.warehouseId;
    
    // Notes and instructions
    if (data.warehouseNotes !== undefined) updateData.warehouseNotes = data.warehouseNotes;
    if (data.customerNotes !== undefined) updateData.customerNotes = data.customerNotes;
    if (data.specialInstructions !== undefined) updateData.specialInstructions = data.specialInstructions;
    
    // Package characteristics
    if (data.isFragile !== undefined) updateData.isFragile = data.isFragile;
    if (data.isHighValue !== undefined) updateData.isHighValue = data.isHighValue;
    if (data.requiresAdultSignature !== undefined) updateData.requiresAdultSignature = data.requiresAdultSignature;
    if (data.isRestricted !== undefined) updateData.isRestricted = data.isRestricted;
    
    // Customs information
    if (data.customsDeclaration !== undefined) updateData.customsDeclaration = data.customsDeclaration;
    if (data.customsValue !== undefined) updateData.customsValue = data.customsValue ? String(data.customsValue) : null;
    if (data.customsValueCurrency !== undefined) updateData.customsValueCurrency = data.customsValueCurrency;
    if (data.countryOfOrigin !== undefined) updateData.countryOfOrigin = data.countryOfOrigin;
    if (data.hsCode !== undefined) updateData.hsCode = data.hsCode;
    
    // Pre-receiving workflow
    if (data.incomingShipmentItemId !== undefined) updateData.incomingShipmentItemId = data.incomingShipmentItemId;
    
    // Processing info
    if (data.processedBy !== undefined) updateData.processedBy = data.processedBy;
    if (data.processedAt !== undefined) {
      updateData.processedAt = data.processedAt ? new Date(data.processedAt) : null;
    }

    // Update the package
    const [updatedPackage] = await tx
      .update(packages)
      .set(updateData)
      .where(eq(packages.id, id))
      .returning();

    // Create status history record if status changed
    if (data.status && data.status !== currentPackage.status) {
      await tx
        .insert(packageStatusHistory)
        .values({
          packageId: id,
          fromStatus: currentPackage.status as PackageStatus,
          toStatus: data.status,
          changeReason: 'manual_update',
          changedBy: updatedBy || null,
          createdAt: new Date(),
        });
    }

    return updatedPackage;
  });
}

// Helper function to calculate volumetric weight
function calculateVolumetricWeight(
  lengthCm?: number, 
  widthCm?: number, 
  heightCm?: number
): number | null {
  if (!lengthCm || !widthCm || !heightCm) {
    return null;
  }
  
  // Standard formula: (L × W × H) / 5000
  return (lengthCm * widthCm * heightCm) / 5000;
}

// Helper function to calculate chargeable weight
function calculateChargeableWeight(
  actualWeight?: number, 
  volumetricWeight?: number | null
): number | null {
  if (!actualWeight && !volumetricWeight) {
    return null;
  }
  
  // Use the higher of actual weight or volumetric weight
  const actual = actualWeight || 0;
  const volumetric = volumetricWeight || 0;
  
  return Math.max(actual, volumetric);
}