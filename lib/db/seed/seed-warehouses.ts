// lib/db/seed/seed-warehouses.ts
import { db } from '../index';
import { warehouses, storagePricing, binLocations } from '@/features/warehouses/db/schema';
import { logSeedProgress, logSeedSuccess, logSeedError } from './utils';
import { CreateWarehouseData, CreateStoragePricingData, CreateBinLocationData } from '@/features/warehouses/db/schema';

// Extended interfaces with tenantId for warehouse-related data
interface ExtendedWarehouseData extends CreateWarehouseData {
  tenantId: string;
}

interface ExtendedStoragePricingData extends CreateStoragePricingData {
  tenantId: string;
}

interface ExtendedBinLocationData extends CreateBinLocationData {
  tenantId: string;
}

/**
 * Seed warehouses and related data
 * @param tenantIds Array of tenant IDs to associate warehouses with
 */
export async function seedWarehouses(tenantIds: string[]) {
  if (!tenantIds.length) {
    logSeedError('No tenant IDs provided for seeding warehouses');
    return { warehouses: [], storagePricing: [], binLocations: [] };
  }

  logSeedProgress('Seeding warehouses...');
  
  const warehousesByTenant: Record<string, any[]> = {};
  const allWarehouses: ExtendedWarehouseData[] = [];
  
  // Create warehouses for each tenant
  for (const tenantId of tenantIds) {
    const warehouseData: ExtendedWarehouseData[] = [
      {
        tenantId,
        code: 'US-NYC-01',
        name: 'New York Distribution Center',
        description: 'Main US East Coast warehouse',
        countryCode: 'US',
        addressLine1: '123 Shipping Avenue',
        addressLine2: 'Suite 400',
        city: 'New York',
        stateProvince: 'NY',
        postalCode: '10001',
        phone: '+1-212-555-0123',
        email: 'nyc-warehouse@example.com',
        timezone: 'America/New_York',
        currencyCode: 'USD',
        taxTreatment: 'standard' as const,
        storageFreeDays: 30,
        storageFeePerDay: '2.50',
        maxPackageWeightKg: '50.00',
        maxPackageValue: '10000.00',
        operatingHours: {
          monday: { open: '08:00', close: '18:00' },
          tuesday: { open: '08:00', close: '18:00' },
          wednesday: { open: '08:00', close: '18:00' },
          thursday: { open: '08:00', close: '18:00' },
          friday: { open: '08:00', close: '18:00' },
          saturday: { open: '09:00', close: '14:00' },
          sunday: { open: null, close: null }
        }
      },
      {
        tenantId,
        code: 'US-LAX-01',
        name: 'Los Angeles Fulfillment Center',
        description: 'Main US West Coast warehouse',
        countryCode: 'US',
        addressLine1: '456 Logistics Boulevard',
        city: 'Los Angeles',
        stateProvince: 'CA',
        postalCode: '90001',
        phone: '+1-323-555-0123',
        email: 'la-warehouse@example.com',
        timezone: 'America/Los_Angeles',
        currencyCode: 'USD',
        taxTreatment: 'standard' as const,
        storageFreeDays: 30,
        storageFeePerDay: '2.25',
        maxPackageWeightKg: '45.00',
        maxPackageValue: '8000.00',
        operatingHours: {
          monday: { open: '07:00', close: '19:00' },
          tuesday: { open: '07:00', close: '19:00' },
          wednesday: { open: '07:00', close: '19:00' },
          thursday: { open: '07:00', close: '19:00' },
          friday: { open: '07:00', close: '19:00' },
          saturday: { open: '08:00', close: '16:00' },
          sunday: { open: null, close: null }
        }
      }
    ];
    
    // Add tenant ID to each warehouse
    const tenantWarehouses = warehouseData.map(warehouse => ({
      ...warehouse,
      tenantId
    }));
    
    allWarehouses.push(...tenantWarehouses);
  }
  
  const insertedWarehouses = await db.insert(warehouses).values(allWarehouses).returning();
  logSeedSuccess(`Created ${insertedWarehouses.length} warehouses`);
  
  // Group warehouses by tenant
  for (const warehouse of insertedWarehouses) {
    if (!warehousesByTenant[warehouse.tenantId]) {
      warehousesByTenant[warehouse.tenantId] = [];
    }
    warehousesByTenant[warehouse.tenantId].push(warehouse);
  }
  
  // Create storage pricing for each warehouse
  logSeedProgress('Seeding storage pricing...');
  const storagePricingData: ExtendedStoragePricingData[] = [];
  
  for (const warehouse of insertedWarehouses) {
    storagePricingData.push({
      tenantId: warehouse.tenantId,
      warehouseId: warehouse.id,
      freeDays: warehouse.storageFreeDays || 7,
      dailyRateAfterFree: warehouse.storageFeePerDay || '1.00',
      currency: warehouse.currencyCode,
      effectiveFrom: new Date().toISOString().split('T')[0],
      notes: `Standard storage pricing for ${warehouse.name}`
    });
  }
  
  const insertedStoragePricing = await db.insert(storagePricing).values(storagePricingData).returning();
  logSeedSuccess(`Created ${insertedStoragePricing.length} storage pricing records`);
  
  // Create bin locations for each warehouse
  logSeedProgress('Seeding bin locations...');
  const binLocationData: ExtendedBinLocationData[] = [];
  
  for (const warehouse of insertedWarehouses) {
    // Create 10 bin locations for each warehouse
    for (let i = 1; i <= 10; i++) {
      const zoneName = i <= 3 ? 'A' : i <= 6 ? 'B' : 'C';
      const binNumber = i.toString().padStart(3, '0');
      
      binLocationData.push({
        tenantId: warehouse.tenantId,
        warehouseId: warehouse.id,
        binCode: `${zoneName}-${binNumber}`,
        zoneName,
        description: `${zoneName} Zone - Bin ${binNumber}`,
        maxCapacity: 50,
        maxWeightKg: '100.00',
        dailyPremium: i <= 3 ? '1.00' : i <= 6 ? '0.50' : '0.00',
        currency: warehouse.currencyCode,
        isClimateControlled: i <= 3,
        isSecured: i <= 3,
        isAccessible: true
      });
    }
  }
  
  const insertedBinLocations = await db.insert(binLocations).values(binLocationData).returning();
  logSeedSuccess(`Created ${insertedBinLocations.length} bin locations`);
  
  return {
    warehouses: insertedWarehouses,
    storagePricing: insertedStoragePricing,
    binLocations: insertedBinLocations
  };
}
