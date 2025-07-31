// features/packages/db/queries/packages/create-package.query.ts

import { db } from '@/lib/db';
import { 
  packages, 
  packageStatusHistory, 
  type Package,
  type PackageStatus 
} from '@/features/packages/db/schema';
import { gte, lt, and } from 'drizzle-orm';

export interface CreatePackageData {
  // Customer reference
  customerProfileId: string;
  
  // Package identification
  internalId?: string;
  trackingNumberInbound?: string;
  trackingNumberOutbound?: string;
  
  // Package details
  description?: string;
  
  // Physical characteristics
  weightKg?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  volumetricWeightKg?: number;
  chargeableWeightKg?: number;
  
  // Status and dates
  status?: PackageStatus;
  expectedArrivalDate?: string | Date | null;
  receivedAt?: string | Date | null;
  readyToShipAt?: string | Date | null;
  storageExpiresAt?: string | Date | null;
  
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
  processedAt?: string | Date | null;
}

export async function createPackage(
  data: CreatePackageData,
  createdBy?: string
): Promise<{ package: Package; statusHistoryId: string }> {
  return await db.transaction(async (tx) => {
    // Generate internal ID if not provided
    const internalId = data.internalId || await generateInternalId(tx);
    
    // Set default status if not provided
    const status: PackageStatus = data.status || 'expected';
    
    // Create the package
    const [newPackage] = await tx
      .insert(packages)
      .values({
        // Customer reference
        customerProfileId: data.customerProfileId,
        
        // Package identification
        internalId,
        trackingNumberInbound: data.trackingNumberInbound,
        trackingNumberOutbound: data.trackingNumberOutbound,
        
        // Package details
        description: data.description,
        
        // Physical characteristics
        weightKg: data.weightKg,
        lengthCm: data.lengthCm,
        widthCm: data.widthCm,
        heightCm: data.heightCm,
        volumetricWeightKg: data.volumetricWeightKg || calculateVolumetricWeight(
          data.lengthCm, 
          data.widthCm, 
          data.heightCm
        ),
        chargeableWeightKg: data.chargeableWeightKg || calculateChargeableWeight(
          data.weightKg,
          data.volumetricWeightKg || calculateVolumetricWeight(
            data.lengthCm, 
            data.widthCm, 
            data.heightCm
          )
        ),
        
        // Status and dates
        status,
        expectedArrivalDate: data.expectedArrivalDate ? new Date(data.expectedArrivalDate) : null,
        receivedAt: data.receivedAt ? new Date(data.receivedAt) : null,
        readyToShipAt: data.readyToShipAt ? new Date(data.readyToShipAt) : null,
        storageExpiresAt: data.storageExpiresAt ? new Date(data.storageExpiresAt) : null,
        
        // Warehouse assignment
        warehouseId: data.warehouseId,
        
        // Notes and instructions
        warehouseNotes: data.warehouseNotes,
        customerNotes: data.customerNotes,
        specialInstructions: data.specialInstructions,
        
        // Package characteristics
        isFragile: data.isFragile || false,
        isHighValue: data.isHighValue || false,
        requiresAdultSignature: data.requiresAdultSignature || false,
        isRestricted: data.isRestricted || false,
        
        // Customs information
        customsDeclaration: data.customsDeclaration,
        customsValue: data.customsValue,
        customsValueCurrency: data.customsValueCurrency,
        countryOfOrigin: data.countryOfOrigin,
        hsCode: data.hsCode,
        
        // Pre-receiving workflow
        incomingShipmentItemId: data.incomingShipmentItemId,
        
        // Processing info
        processedBy: data.processedBy || createdBy,
        processedAt: data.processedAt ? new Date(data.processedAt) : null,
        
        // Timestamps
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Create initial status history record
    const [statusHistory] = await tx
      .insert(packageStatusHistory)
      .values({
        packageId: newPackage.id,
        fromStatus: null, // Initial creation
        toStatus: status,
        changeReason: 'package_created',
        changedBy: createdBy || null,
        createdAt: new Date(),
      })
      .returning();

    return {
      package: newPackage,
      statusHistoryId: statusHistory.id,
    };
  });
}

// Helper function to generate internal ID
async function generateInternalId(tx: any): Promise<string> {
  // Get current date for prefix
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const prefix = `PKG${year}${month}${day}`;
  
  // Get count of packages created today
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);
  
  const [{ count }] = await tx
    .select({ count: packages.id })
    .from(packages)
    .where(
      and(
        gte(packages.createdAt, startOfDay),
        lt(packages.createdAt, endOfDay)
      )
    );
  
  const sequence = (count + 1).toString().padStart(4, '0');
  return `${prefix}-${sequence}`;
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