// lib/db/seed/seed-packages.ts
import { db } from '../index';
import { packages, packageStatusHistory } from '@/features/packages/db/schema';
import { logSeedProgress, logSeedSuccess, logSeedError } from './utils';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';

// Define interfaces for package data
interface ExtendedPackageData {
  tenantId: string;
  customerProfileId: string;
  warehouseId: string;
  incomingShipmentItemId?: string;
  internalId: string;
  trackingNumberInbound?: string;
  trackingNumberOutbound?: string;
  weightKg?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  volumetricWeightKg?: number;
  chargeableWeightKg?: number;
  status: string;
  statusNotes?: string;
  expectedArrivalDate?: Date | string;
  receivedAt?: Date | string;
  readyToShipAt?: Date | string;
  storageExpiresAt?: Date | string;
  description?: string;
  warehouseNotes?: string;
  customerNotes?: string;
  specialInstructions?: string;
  isFragile?: boolean;
  isHighValue?: boolean;
  requiresAdultSignature?: boolean;
  isRestricted?: boolean;
  processedBy?: string;
  processedAt?: Date | string;
  customsDeclaration?: string;
  customsValue?: number;
  customsValueCurrency?: string;
  countryOfOrigin?: string;
  hsCode?: string;
  // Added fields based on memory
  suiteCodeCaptured?: string;
  senderName?: string;
  senderCompany?: string;
  senderAddress?: string;
  senderCity?: string;
  senderCountryCode?: string;
  senderPostalCode?: string;
  senderPhone?: string;
  senderEmail?: string;
  senderTrackingUrl?: string;
  estimatedValue?: number;
  estimatedValueCurrency?: string;
}

interface ExtendedPackageStatusHistoryData {
  packageId: string;
  fromStatus: string;
  toStatus: string;
  notes?: string;
  createdBy?: string;
}

/**
 * Seed packages and related data
 * @param tenantIds Array of tenant IDs to associate packages with
 * @param warehouseIds Array of warehouse IDs to associate packages with
 * @param customerIds Array of customer IDs to associate packages with
 * @param resetData If true, deletes existing package data before seeding
 */
export async function seedPackages(
  tenantIds: string[],
  warehouseIds: string[],
  customerIds: string[],
  resetData: boolean = false
) {
  if (!tenantIds.length || !warehouseIds.length || !customerIds.length) {
    logSeedError('Missing required IDs for seeding packages');
    return { packages: [], packageStatusHistory: [] };
  }

  // Use the first tenant, warehouse, and customer for simplicity
  const tenantId = tenantIds[0];
  const warehouseId = warehouseIds[0];
  const customerProfileId = customerIds[0];

  if (resetData) {
    logSeedProgress('Resetting package data...');
    await db.delete(packageStatusHistory);
    await db.delete(packages);
    logSeedSuccess('Package data reset complete');
  }

  logSeedProgress('Seeding packages...');

  // Generate internal IDs with format PF-YYYYMMDD-XXXX
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Helper function to format dates
  const formatDateString = (date: Date): string => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };
  
  // Create 3 sample packages
  const packageData: ExtendedPackageData[] = [
    {
      tenantId,
      customerProfileId,
      warehouseId,
      internalId: `PF-${dateStr}-0001`,
      trackingNumberInbound: 'USPS12345678901',
      weightKg: 2.5,
      lengthCm: 30,
      widthCm: 20,
      heightCm: 15,
      volumetricWeightKg: 1.5,
      chargeableWeightKg: 2.5,
      status: 'received',
      expectedArrivalDate: formatDateString(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)),
      receivedAt: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
      description: 'Electronics - Smartphone',
      warehouseNotes: 'Placed in secure storage area',
      isFragile: true,
      isHighValue: true,
      customsValue: 899.99,
      customsValueCurrency: 'USD',
      countryOfOrigin: 'CN',
      suiteCodeCaptured: 'SUITE123',
      senderName: 'John Smith',
      senderCompany: 'Tech Gadgets Inc.',
      senderAddress: '123 Electronics Blvd',
      senderCity: 'Shenzhen',
      senderCountryCode: 'CN',
      senderPostalCode: '518000',
      senderEmail: 'john@techgadgets.com',
      estimatedValue: 899.99,
      estimatedValueCurrency: 'USD'
    },
    {
      tenantId,
      customerProfileId,
      warehouseId,
      internalId: `PF-${dateStr}-0002`,
      trackingNumberInbound: 'FEDEX98765432101',
      weightKg: 5.2,
      lengthCm: 45,
      widthCm: 35,
      heightCm: 25,
      volumetricWeightKg: 6.5,
      chargeableWeightKg: 6.5,
      status: 'processing',
      expectedArrivalDate: formatDateString(new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000)),
      receivedAt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
      description: 'Clothing - Winter Jacket',
      customerNotes: 'Please verify size before shipping',
      isFragile: false,
      isHighValue: false,
      customsValue: 149.99,
      customsValueCurrency: 'USD',
      countryOfOrigin: 'US',
      suiteCodeCaptured: 'SUITE456',
      senderName: 'Fashion Outlet',
      senderCompany: 'Fashion Outlet LLC',
      senderAddress: '789 Style Avenue',
      senderCity: 'New York',
      senderCountryCode: 'US',
      senderPostalCode: '10001',
      senderEmail: 'orders@fashionoutlet.com',
      estimatedValue: 149.99,
      estimatedValueCurrency: 'USD'
    },
    {
      tenantId,
      customerProfileId,
      warehouseId,
      internalId: `PF-${dateStr}-0003`,
      trackingNumberInbound: 'DHL87654321098',
      weightKg: 10.8,
      lengthCm: 60,
      widthCm: 40,
      heightCm: 30,
      volumetricWeightKg: 12.0,
      chargeableWeightKg: 12.0,
      status: 'expected',
      expectedArrivalDate: formatDateString(new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)),
      description: 'Books - Educational Materials',
      specialInstructions: 'Handle with care, contains fragile items',
      isFragile: true,
      isHighValue: false,
      customsValue: 299.99,
      customsValueCurrency: 'USD',
      countryOfOrigin: 'GB',
      suiteCodeCaptured: 'SUITE789',
      senderName: 'Academic Publishers',
      senderCompany: 'Academic Publishers Ltd',
      senderAddress: '456 Knowledge Road',
      senderCity: 'London',
      senderCountryCode: 'GB',
      senderPostalCode: 'SW1A 1AA',
      senderEmail: 'shipping@academicpub.com',
      estimatedValue: 299.99,
      estimatedValueCurrency: 'USD'
    }
  ];

  // Insert packages
  const insertedPackages = await db.insert(packages).values(packageData as any).returning();
  
  logSeedSuccess(`Created ${insertedPackages.length} packages`);

  // Create status history for each package
  const statusHistoryData: ExtendedPackageStatusHistoryData[] = [];
  
  for (const pkg of insertedPackages) {
    // Add initial status
    statusHistoryData.push({
      packageId: pkg.id,
      fromStatus: 'pending',
      toStatus: 'expected',
      notes: 'Package registered in system'
    });
    
    // Add received status for packages that are received or beyond
    if (['received', 'processing', 'ready_to_ship', 'shipped', 'delivered'].includes(pkg.status)) {
      statusHistoryData.push({
        packageId: pkg.id,
        fromStatus: 'expected',
        toStatus: 'received',
        notes: 'Package received at warehouse'
      });
    }
    
    // Add processing status for packages that are processing or beyond
    if (['processing', 'ready_to_ship', 'shipped', 'delivered'].includes(pkg.status)) {
      statusHistoryData.push({
        packageId: pkg.id,
        fromStatus: 'received',
        toStatus: 'processing',
        notes: 'Package being processed'
      });
    }
  }
  
  // Insert status history
  const insertedStatusHistory = await db.insert(packageStatusHistory).values(statusHistoryData).returning();
  
  logSeedSuccess(`Created ${insertedStatusHistory.length} package status history records`);
  
  return { packages: insertedPackages, packageStatusHistory: insertedStatusHistory };
}
