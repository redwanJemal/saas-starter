// lib/db/seed/index.ts
import { db } from '../index';
import { sql } from 'drizzle-orm';
import { seedTenants } from './seed-tenants';
import { seedUsersAndRoles } from './seed-users-roles';
import { seedWarehouses } from './seed-warehouses';
import { seedReferenceData, seedTenantSettings, seedSystemSettings } from './seed-settings';
import { logSeedProgress, logSeedSuccess, logSeedError } from './utils';
import { tenantSettings } from '@/features/settings/db/schema';

/**
 * Main seeder function that orchestrates all seeding operations
 * in the correct order to maintain referential integrity
 */
async function seed() {
  try {
    logSeedProgress('Starting database seeding...');
    
    // Step 1: Seed tenants first as they are the foundation of the multi-tenant architecture
    logSeedProgress('Step 1: Seeding tenants...');
    const tenants = await seedTenants();
    const tenantIds = tenants.map(tenant => tenant.id);
    logSeedSuccess(`Completed seeding ${tenants.length} tenants`);
    
    // Step 2: Seed global reference data (countries, currencies, couriers)
    logSeedProgress('Step 2: Seeding reference data...');
    const referenceData = await seedReferenceData();
    logSeedSuccess('Completed seeding reference data');
    
    // Step 3: Seed system settings and feature flags
    logSeedProgress('Step 3: Seeding system settings and feature flags...');
    const systemData = await seedSystemSettings();
    logSeedSuccess('Completed seeding system settings and feature flags');
    
    // Step 4: Seed users, roles, and permissions for each tenant
    logSeedProgress('Step 4: Seeding users, roles, and permissions...');
    const usersAndRoles = await seedUsersAndRoles(tenantIds);
    logSeedSuccess(`Completed seeding users and roles for ${tenantIds.length} tenants`);
    
    // Step 5: Seed warehouses and related data for each tenant
    logSeedProgress('Step 5: Seeding warehouses...');
    const warehouseData = await seedWarehouses(tenantIds);
    logSeedSuccess(`Completed seeding warehouses for ${tenantIds.length} tenants`);
    
    // Step 6: Seed tenant-specific settings and link to reference data
    logSeedProgress('Step 6: Seeding tenant settings...');
    const tenantSettingsData = await seedTenantSettings(tenantIds, {
      currencies: referenceData.currencies,
      couriers: referenceData.couriers
    });
    logSeedSuccess(`Completed seeding tenant settings for ${tenantIds.length} tenants`);
    
    // Step 7: Update default warehouse IDs in tenant settings
    logSeedProgress('Step 7: Updating default warehouse settings...');
    for (const tenant of tenants) {
      const tenantWarehouses = warehouseData.warehouses.filter(w => w.tenantId === tenant.id);
      if (tenantWarehouses.length > 0) {
        const defaultWarehouse = tenantWarehouses[0];
        await db
          .update(tenantSettings)
          .set({ value: defaultWarehouse.id })
          .where(sql`${tenantSettings.tenantId} = ${tenant.id} AND ${tenantSettings.key} = 'default_warehouse_id'`);
      }
    }
    logSeedSuccess('Completed updating default warehouse settings');
    
    logSeedSuccess('Database seeding completed successfully!');
    return {
      tenants,
      referenceData,
      systemData,
      usersAndRoles,
      warehouseData,
      tenantSettingsData
    };
  } catch (error: any) {
    logSeedError(`Error seeding database: ${error.message || 'Unknown error'}`);
    console.error(error);
    throw error;
  }
}

/**
 * Run the seeder
 */
async function main() {
  try {
    await seed();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

// Execute if this file is run directly
if (require.main === module) {
  main();
}

export { seed };
