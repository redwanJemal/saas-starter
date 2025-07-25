// lib/db/seed-storage-config.ts

import { db } from './drizzle';
import { storagePricing, binLocations, warehouses, tenants } from './schema';
import { eq, and, count } from 'drizzle-orm';

interface StoragePricingConfig {
  freeDays: number;
  dailyRateAfterFree: number;
  currency: string;
  effectiveFrom: string;
  effectiveUntil?: string;
  notes?: string;
}

interface BinLocationConfig {
  binCode: string;
  zoneName: string;
  description?: string;
  maxCapacity: number;
  maxWeightKg?: number;
  dailyPremium: number;
  isClimateControlled: boolean;
  isSecured: boolean;
  isAccessible: boolean;
}

const DEFAULT_STORAGE_PRICING: StoragePricingConfig = {
  freeDays: 7,
  dailyRateAfterFree: 2.00,
  currency: 'USD',
  effectiveFrom: '2025-01-01',
  notes: 'Standard storage pricing - 7 free days, then $2/day per package'
};

const DEFAULT_BIN_LOCATIONS: BinLocationConfig[] = [
  // Standard Storage Zones
  { binCode: 'A1', zoneName: 'Standard', description: 'Ground level standard storage', maxCapacity: 15, dailyPremium: 0, isClimateControlled: false, isSecured: false, isAccessible: true },
  { binCode: 'A2', zoneName: 'Standard', description: 'Ground level standard storage', maxCapacity: 15, dailyPremium: 0, isClimateControlled: false, isSecured: false, isAccessible: true },
  { binCode: 'A3', zoneName: 'Standard', description: 'Ground level standard storage', maxCapacity: 15, dailyPremium: 0, isClimateControlled: false, isSecured: false, isAccessible: true },
  { binCode: 'A4', zoneName: 'Standard', description: 'Ground level standard storage', maxCapacity: 15, dailyPremium: 0, isClimateControlled: false, isSecured: false, isAccessible: true },
  { binCode: 'A5', zoneName: 'Standard', description: 'Ground level standard storage', maxCapacity: 15, dailyPremium: 0, isClimateControlled: false, isSecured: false, isAccessible: true },
  
  { binCode: 'B1', zoneName: 'Standard', description: 'Second level standard storage', maxCapacity: 12, dailyPremium: 0, isClimateControlled: false, isSecured: false, isAccessible: true },
  { binCode: 'B2', zoneName: 'Standard', description: 'Second level standard storage', maxCapacity: 12, dailyPremium: 0, isClimateControlled: false, isSecured: false, isAccessible: true },
  { binCode: 'B3', zoneName: 'Standard', description: 'Second level standard storage', maxCapacity: 12, dailyPremium: 0, isClimateControlled: false, isSecured: false, isAccessible: true },
  { binCode: 'B4', zoneName: 'Standard', description: 'Second level standard storage', maxCapacity: 12, dailyPremium: 0, isClimateControlled: false, isSecured: false, isAccessible: true },
  { binCode: 'B5', zoneName: 'Standard', description: 'Second level standard storage', maxCapacity: 12, dailyPremium: 0, isClimateControlled: false, isSecured: false, isAccessible: true },

  // Climate Controlled Storage
  { binCode: 'CC1', zoneName: 'Climate Controlled', description: 'Temperature and humidity controlled storage', maxCapacity: 10, maxWeightKg: 50, dailyPremium: 1.00, isClimateControlled: true, isSecured: true, isAccessible: true },
  { binCode: 'CC2', zoneName: 'Climate Controlled', description: 'Temperature and humidity controlled storage', maxCapacity: 10, maxWeightKg: 50, dailyPremium: 1.00, isClimateControlled: true, isSecured: true, isAccessible: true },
  { binCode: 'CC3', zoneName: 'Climate Controlled', description: 'Temperature and humidity controlled storage', maxCapacity: 10, maxWeightKg: 50, dailyPremium: 1.00, isClimateControlled: true, isSecured: true, isAccessible: true },

  // Secure Storage (for valuable items)
  { binCode: 'SEC1', zoneName: 'Secure', description: 'High security storage for valuable items', maxCapacity: 8, maxWeightKg: 30, dailyPremium: 2.50, isClimateControlled: true, isSecured: true, isAccessible: false },
  { binCode: 'SEC2', zoneName: 'Secure', description: 'High security storage for valuable items', maxCapacity: 8, maxWeightKg: 30, dailyPremium: 2.50, isClimateControlled: true, isSecured: true, isAccessible: false },
  { binCode: 'SEC3', zoneName: 'Secure', description: 'High security storage for valuable items', maxCapacity: 8, maxWeightKg: 30, dailyPremium: 2.50, isClimateControlled: true, isSecured: true, isAccessible: false },

  // Oversized Storage
  { binCode: 'OS1', zoneName: 'Oversized', description: 'Storage for large packages', maxCapacity: 5, maxWeightKg: 100, dailyPremium: 3.00, isClimateControlled: false, isSecured: true, isAccessible: true },
  { binCode: 'OS2', zoneName: 'Oversized', description: 'Storage for large packages', maxCapacity: 5, maxWeightKg: 100, dailyPremium: 3.00, isClimateControlled: false, isSecured: true, isAccessible: true },

  // Quick Access (for frequent shipments)
  { binCode: 'QA1', zoneName: 'Quick Access', description: 'Easy access for frequent shippers', maxCapacity: 20, dailyPremium: 0.50, isClimateControlled: false, isSecured: false, isAccessible: true },
  { binCode: 'QA2', zoneName: 'Quick Access', description: 'Easy access for frequent shippers', maxCapacity: 20, dailyPremium: 0.50, isClimateControlled: false, isSecured: false, isAccessible: true },
  { binCode: 'QA3', zoneName: 'Quick Access', description: 'Easy access for frequent shippers', maxCapacity: 20, dailyPremium: 0.50, isClimateControlled: false, isSecured: false, isAccessible: true },
];

export async function seedStorageConfiguration(tenantId?: string, warehouseId?: string) {
  try {
    console.log('🏗️  Seeding storage configuration...');

    // If no specific tenant/warehouse provided, seed for all active tenants/warehouses
    let targetTenants: string[] = [];
    
    if (tenantId) {
      targetTenants = [tenantId];
    } else {
      const tenantQuery = await db
        .select({ id: tenants.id })
        .from(tenants)
        .where(eq(tenants.status, 'active'));
      targetTenants = tenantQuery.map(t => t.id);
    }

    for (const currentTenantId of targetTenants) {
      console.log(`📦 Seeding storage config for tenant: ${currentTenantId}`);

      // Get warehouses for this tenant
      let targetWarehouses: string[] = [];
      
      if (warehouseId) {
        // Verify warehouse belongs to tenant
        const warehouseQuery = await db
          .select({ id: warehouses.id })
          .from(warehouses)
          .where(
            and(
              eq(warehouses.id, warehouseId),
              eq(warehouses.tenantId, currentTenantId),
              eq(warehouses.status, 'active')
            )
          );
        targetWarehouses = warehouseQuery.map(w => w.id);
      } else {
        const warehouseQuery = await db
          .select({ id: warehouses.id })
          .from(warehouses)
          .where(
            and(
              eq(warehouses.tenantId, currentTenantId),
              eq(warehouses.status, 'active')
            )
          );
        targetWarehouses = warehouseQuery.map(w => w.id);
      }

      // Create storage pricing configuration
      const existingPricingQuery = await db
        .select()
        .from(storagePricing)
        .where(
          and(
            eq(storagePricing.tenantId, currentTenantId),
            eq(storagePricing.isActive, true)
          )
        )
        .limit(1);

      if (existingPricingQuery.length === 0) {
        console.log(`💰 Creating storage pricing for tenant ${currentTenantId}`);
        
        await db.insert(storagePricing).values({
          tenantId: currentTenantId,
          freeDays: DEFAULT_STORAGE_PRICING.freeDays,
          dailyRateAfterFree: DEFAULT_STORAGE_PRICING.dailyRateAfterFree.toString(),
          currency: DEFAULT_STORAGE_PRICING.currency,
          effectiveFrom: DEFAULT_STORAGE_PRICING.effectiveFrom,
          effectiveUntil: DEFAULT_STORAGE_PRICING.effectiveUntil || null,
          isActive: true,
          notes: DEFAULT_STORAGE_PRICING.notes
        });

        console.log(`✅ Storage pricing created: ${DEFAULT_STORAGE_PRICING.freeDays} free days, $${DEFAULT_STORAGE_PRICING.dailyRateAfterFree}/day`);
      } else {
        console.log(`⏭️  Storage pricing already exists for tenant ${currentTenantId}`);
      }

      // Create bin locations for each warehouse
      for (const currentWarehouseId of targetWarehouses) {
        console.log(`🗂️  Creating bin locations for warehouse ${currentWarehouseId}`);

        // Check if bin locations already exist
        const existingBinsQuery = await db
          .select({ count: count() })
          .from(binLocations)
          .where(
            and(
              eq(binLocations.tenantId, currentTenantId),
              eq(binLocations.warehouseId, currentWarehouseId)
            )
          );

        const existingBinCount = existingBinsQuery[0]?.count || 0;

        if (existingBinCount === 0) {
          // Create all default bin locations
          const binLocationValues = DEFAULT_BIN_LOCATIONS.map(bin => ({
            tenantId: currentTenantId,
            warehouseId: currentWarehouseId,
            binCode: bin.binCode,
            zoneName: bin.zoneName,
            description: bin.description,
            maxCapacity: bin.maxCapacity,
            currentOccupancy: 0,
            maxWeightKg: bin.maxWeightKg?.toString(),
            dailyPremium: bin.dailyPremium.toString(),
            currency: 'USD',
            isClimateControlled: bin.isClimateControlled,
            isSecured: bin.isSecured,
            isAccessible: bin.isAccessible,
            isActive: true
          }));

          await db.insert(binLocations).values(binLocationValues);

          console.log(`✅ Created ${DEFAULT_BIN_LOCATIONS.length} bin locations for warehouse ${currentWarehouseId}`);
          
          // Log bin breakdown by zone
          const zoneBreakdown = DEFAULT_BIN_LOCATIONS.reduce((acc, bin) => {
            acc[bin.zoneName] = (acc[bin.zoneName] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          Object.entries(zoneBreakdown).forEach(([zone, count]) => {
            console.log(`   📍 ${zone}: ${count} bins`);
          });

        } else {
          console.log(`⏭️  Bin locations already exist for warehouse ${currentWarehouseId} (${existingBinCount} bins)`);
        }
      }
    }

    console.log('✅ Storage configuration seeding completed successfully');
    
    return {
      success: true,
      tenantsProcessed: targetTenants.length,
      warehousesProcessed: targetTenants.length,
      message: 'Storage configuration seeded successfully'
    };

  } catch (error) {
    console.error('❌ Error seeding storage configuration:', error);
    throw error;
  }
}

// Utility function to update storage pricing
export async function updateStoragePricing(
  tenantId: string, 
  config: Partial<StoragePricingConfig>
) {
  try {
    // Deactivate current pricing
    await db
      .update(storagePricing)
      .set({ 
        isActive: false,
        effectiveUntil: new Date().toISOString().split('T')[0],
        updatedAt: new Date()
      })
      .where(
        and(
          eq(storagePricing.tenantId, tenantId),
          eq(storagePricing.isActive, true)
        )
      );

    // Create new pricing
    const newPricing = {
      tenantId,
      freeDays: config.freeDays || DEFAULT_STORAGE_PRICING.freeDays,
      dailyRateAfterFree: (config.dailyRateAfterFree || DEFAULT_STORAGE_PRICING.dailyRateAfterFree).toString(),
      currency: config.currency || DEFAULT_STORAGE_PRICING.currency,
      effectiveFrom: config.effectiveFrom || new Date().toISOString().split('T')[0],
      effectiveUntil: config.effectiveUntil || null,
      isActive: true,
      notes: config.notes
    };

    const [updatedPricing] = await db
      .insert(storagePricing)
      .values(newPricing)
      .returning();

    return updatedPricing;

  } catch (error) {
    console.error('Error updating storage pricing:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  console.log('🚀 Starting storage configuration seeding...');
  
  seedStorageConfiguration()
    .then((result) => {
      console.log('📊 Seeding results:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}