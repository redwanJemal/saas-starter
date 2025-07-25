// lib/db/seed-shipping-zones.ts
import { db } from './drizzle';
import { zones, zoneCountries, shippingRates, tenants, warehouses } from './schema';
import { eq } from 'drizzle-orm';

interface ZoneData {
  name: string;
  description: string;
  countries: string[];
}

interface RateData {
  serviceType: 'standard' | 'express' | 'economy';
  baseRate: number;
  perKgRate: number;
  minCharge: number;
  maxWeightKg?: number;
}

const DEFAULT_ZONES: ZoneData[] = [
  {
    name: 'Middle East',
    description: 'GCC countries and nearby Middle Eastern nations',
    countries: ['AE', 'SA', 'KW', 'QA', 'BH', 'OM', 'JO', 'LB'],
  },
  {
    name: 'Europe Zone 1',
    description: 'Major European countries with frequent shipments',
    countries: ['GB', 'DE', 'FR', 'NL', 'BE', 'LU'],
  },
  {
    name: 'Europe Zone 2',
    description: 'Other European countries',
    countries: ['IT', 'ES', 'PT', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI'],
  },
  {
    name: 'North America',
    description: 'United States and Canada',
    countries: ['US', 'CA'],
  },
  {
    name: 'Asia Pacific',
    description: 'Major Asia Pacific destinations',
    countries: ['SG', 'HK', 'JP', 'AU', 'NZ', 'KR', 'TW'],
  },
  {
    name: 'Rest of World',
    description: 'All other countries not covered by specific zones',
    countries: ['*'], // Special indicator for "all other countries"
  },
];

// Base rates from Dubai warehouse (example rates in USD)
const BASE_RATES: Record<string, Record<string, RateData>> = {
  'Middle East': {
    standard: { serviceType: 'standard', baseRate: 15, perKgRate: 3, minCharge: 25 },
    express: { serviceType: 'express', baseRate: 25, perKgRate: 5, minCharge: 40 },
    economy: { serviceType: 'economy', baseRate: 10, perKgRate: 2, minCharge: 20 },
  },
  'Europe Zone 1': {
    standard: { serviceType: 'standard', baseRate: 25, perKgRate: 5, minCharge: 40 },
    express: { serviceType: 'express', baseRate: 45, perKgRate: 8, minCharge: 70 },
    economy: { serviceType: 'economy', baseRate: 20, perKgRate: 4, minCharge: 35 },
  },
  'Europe Zone 2': {
    standard: { serviceType: 'standard', baseRate: 30, perKgRate: 6, minCharge: 45 },
    express: { serviceType: 'express', baseRate: 50, perKgRate: 9, minCharge: 75 },
    economy: { serviceType: 'economy', baseRate: 25, perKgRate: 5, minCharge: 40 },
  },
  'North America': {
    standard: { serviceType: 'standard', baseRate: 35, perKgRate: 7, minCharge: 50 },
    express: { serviceType: 'express', baseRate: 55, perKgRate: 10, minCharge: 80 },
    economy: { serviceType: 'economy', baseRate: 28, perKgRate: 6, minCharge: 45 },
  },
  'Asia Pacific': {
    standard: { serviceType: 'standard', baseRate: 30, perKgRate: 6, minCharge: 45 },
    express: { serviceType: 'express', baseRate: 50, perKgRate: 9, minCharge: 75 },
    economy: { serviceType: 'economy', baseRate: 25, perKgRate: 5, minCharge: 40 },
  },
  'Rest of World': {
    standard: { serviceType: 'standard', baseRate: 45, perKgRate: 10, minCharge: 70 },
    express: { serviceType: 'express', baseRate: 70, perKgRate: 15, minCharge: 100 },
    economy: { serviceType: 'economy', baseRate: 35, perKgRate: 8, minCharge: 60 },
  },
};

export async function seedShippingZones(tenantId?: string) {
  try {
    console.log('🌍 Starting shipping zones seed...');

    // Get all tenants if no specific tenant provided
    const tenantsToSeed = tenantId 
      ? [{ id: tenantId }]
      : await db.select({ id: tenants.id }).from(tenants);

    if (tenantsToSeed.length === 0) {
      console.log('❌ No tenants found to seed zones for');
      return;
    }

    for (const tenant of tenantsToSeed) {
      console.log(`📦 Seeding zones for tenant: ${tenant.id}`);

      // Check if zones already exist for this tenant
      const existingZones = await db
        .select({ id: zones.id })
        .from(zones)
        .where(eq(zones.tenantId, tenant.id))
        .limit(1);

      if (existingZones.length > 0) {
        console.log(`⏭️  Zones already exist for tenant ${tenant.id}, skipping...`);
        continue;
      }

      // Get tenant's warehouses
      const tenantWarehouses = await db
        .select({ id: warehouses.id, name: warehouses.name })
        .from(warehouses)
        .where(eq(warehouses.tenantId, tenant.id));

      if (tenantWarehouses.length === 0) {
        console.log(`⚠️  No warehouses found for tenant ${tenant.id}, skipping zones...`);
        continue;
      }

      // Create zones for this tenant
      const createdZones: Record<string, string> = {};

      for (const zoneData of DEFAULT_ZONES) {
        try {
          // Create the zone
          const [createdZone] = await db
            .insert(zones)
            .values({
              tenantId: tenant.id,
              name: zoneData.name,
              description: zoneData.description,
              isActive: true,
            })
            .returning();

          createdZones[zoneData.name] = createdZone.id;
          console.log(`  ✅ Created zone: ${zoneData.name}`);

          // Add countries to the zone (skip "Rest of World" special case)
          if (zoneData.countries[0] !== '*') {
            const countryInserts = zoneData.countries.map(countryCode => ({
              zoneId: createdZone.id,
              countryCode,
            }));

            await db
              .insert(zoneCountries)
              .values(countryInserts);

            console.log(`    📍 Added ${zoneData.countries.length} countries`);
          }

          // Create shipping rates for each warehouse
          for (const warehouse of tenantWarehouses) {
            const ratesForZone = BASE_RATES[zoneData.name];
            
            if (ratesForZone) {
              for (const [serviceType, rateData] of Object.entries(ratesForZone)) {
                await db
                  .insert(shippingRates)
                  .values({
                    tenantId: tenant.id,
                    warehouseId: warehouse.id,
                    zoneId: createdZone.id,
                    serviceType: rateData.serviceType,
                    baseRate: rateData.baseRate.toString(),
                    perKgRate: rateData.perKgRate.toString(),
                    minCharge: rateData.minCharge.toString(),
                    maxWeightKg: rateData.maxWeightKg?.toString(),
                    currencyCode: 'USD',
                    isActive: true,
                    effectiveFrom: new Date().toISOString().split('T')[0],
                  });
              }
              
              console.log(`    💰 Created rates for warehouse: ${warehouse.name}`);
            }
          }
        } catch (error) {
          console.error(`❌ Error creating zone ${zoneData.name}:`, error);
        }
      }

      console.log(`✅ Completed seeding zones for tenant: ${tenant.id}`);
    }

    console.log('🎉 Shipping zones seed completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding shipping zones:', error);
    throw error;
  }
}

// Function to seed zones for a specific tenant (can be called from admin panel)
export async function seedZonesForTenant(tenantId: string) {
  return seedShippingZones(tenantId);
}

// Main execution if run directly
if (require.main === module) {
  seedShippingZones()
    .then(() => {
      console.log('Seed completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed failed:', error);
      process.exit(1);
    });
}