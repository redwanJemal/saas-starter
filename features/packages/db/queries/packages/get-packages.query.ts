// features/packages/db/queries/packages/get-packages.query.ts

import { db } from '@/lib/db';
import { 
  packages, 
  incomingShipmentItems, 
  incomingShipments, 
  type Package,
  type PackageStatus
} from '@/features/packages/db/schema';
import { 
  eq, 
  and, 
  or, 
  desc, 
  asc, 
  sql, 
  ilike, 
  gte, 
  lte, 
  count as countFn,
  type SQL 
} from 'drizzle-orm';
import type { PaginatedResponse } from '@/shared/types/api.types';
import { couriers, customerProfiles, users, warehouses } from '@/lib/db/schema';

export interface PackageFilters {
  search?: string;
  status?: PackageStatus;
  warehouseId?: string;
  customerId?: string;
  customerProfileId?: string;
  dateFrom?: string;
  dateTo?: string;
  trackingNumber?: string;
  isHighValue?: boolean;
  isFragile?: boolean;
  isRestricted?: boolean;
  hasDocuments?: boolean;
  internalId?: string;
  courierName?: string;
  batchReference?: string;
  customsValueMin?: number;
  customsValueMax?: number;
  weightMin?: number;
  weightMax?: number;
  page?: number;
  limit?: number;
}

export interface PackageWithDetails extends Package {
  // Customer info
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  
  // Warehouse info
  warehouseName?: string;
  warehouseCode?: string;
  warehouseCity?: string;
  warehouseCountryCode?: string;
  
  // Courier info (from incoming shipment)
  courierName?: string;
  batchReference?: string;
  
  // Processed by user
  processedByName?: string;
  processedByEmail?: string;
  
  // Calculated fields
  calculatedVolumetricWeight?: number;
}

export async function getPackages(
  filters: PackageFilters = {}
): Promise<PaginatedResponse<PackageWithDetails>> {
  const {
    search = '',
    status,
    warehouseId,
    customerId,
    customerProfileId,
    dateFrom,
    dateTo,
    trackingNumber,
    isHighValue,
    isFragile,
    isRestricted,
    hasDocuments,
    internalId,
    courierName,
    batchReference,
    customsValueMin,
    customsValueMax,
    weightMin,
    weightMax,
    page = 1,
    limit = 50
  } = filters;

  const offset = (page - 1) * limit;

  // Build where conditions
  const whereConditions: SQL<unknown>[] = [];

  // Search across multiple fields
  if (search) {
    whereConditions.push(
      or(
        ilike(packages.trackingNumberInbound, `%${search}%`),
        ilike(packages.trackingNumberOutbound, `%${search}%`),
        ilike(packages.internalId, `%${search}%`),
        ilike(packages.description, `%${search}%`),
        sql`${users.firstName} || ' ' || ${users.lastName} ILIKE ${`%${search}%`}`,
        ilike(users.email, `%${search}%`),
        ilike(customerProfiles.id, `%${search}%`)
      )!
    );
  }

  // Status filter
  if (status) {
    whereConditions.push(eq(packages.status, status));
  }

  // Warehouse filter
  if (warehouseId) {
    whereConditions.push(eq(packages.warehouseId, warehouseId));
  }

  // Customer filters
  if (customerId) {
    whereConditions.push(eq(customerProfiles.id, customerId));
  }

  if (customerProfileId) {
    whereConditions.push(eq(packages.customerProfileId, customerProfileId));
  }

  // Date range filter
  if (dateFrom) {
    const fromDate = new Date(dateFrom);
    whereConditions.push(gte(packages.createdAt, fromDate));
  }

  if (dateTo) {
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999); // End of day
    whereConditions.push(lte(packages.createdAt, toDate));
  }

  // Tracking number filter
  if (trackingNumber) {
    whereConditions.push(
      or(
        ilike(packages.trackingNumberInbound, `%${trackingNumber}%`),
        ilike(packages.trackingNumberOutbound, `%${trackingNumber}%`)
      )!
    );
  }

  // Boolean filters
  if (isHighValue !== undefined) {
    whereConditions.push(eq(packages.isHighValue, isHighValue));
  }

  if (isFragile !== undefined) {
    whereConditions.push(eq(packages.isFragile, isFragile));
  }

  if (isRestricted !== undefined) {
    whereConditions.push(eq(packages.isRestricted, isRestricted));
  }

  // Internal ID filter
  if (internalId) {
    whereConditions.push(ilike(packages.internalId, `%${internalId}%`));
  }

  // Courier name filter (from incoming shipment)
  if (courierName) {
    whereConditions.push(ilike(couriers.name, `%${courierName}%`));
  }

  // Batch reference filter
  if (batchReference) {
    whereConditions.push(ilike(incomingShipments.batchReference, `%${batchReference}%`));
  }

  // Value range filters
  if (customsValueMin !== undefined) {
    whereConditions.push(gte(packages.customsValue, customsValueMin));
  }

  if (customsValueMax !== undefined) {
    whereConditions.push(lte(packages.customsValue, customsValueMax));
  }

  // Weight range filters
  if (weightMin !== undefined) {
    whereConditions.push(gte(packages.weightKg, weightMin));
  }

  if (weightMax !== undefined) {
    whereConditions.push(lte(packages.weightKg, weightMax));
  }

  // Build final where clause
  const whereClause = whereConditions.length > 0 
    ? whereConditions.reduce((acc, condition) => 
        acc ? and(acc, condition) : condition, null
      ) 
    : undefined;

  // Main query to get packages with all related data
  const packagesQuery = await db
    .select({
      // Package fields
      id: packages.id,
      tenantId: packages.tenantId,
      internalId: packages.internalId,
      trackingNumberInbound: packages.trackingNumberInbound,
      trackingNumberOutbound: packages.trackingNumberOutbound,
      
      // Package details
      description: packages.description,
      
      // Physical characteristics
      weightKg: packages.weightKg,
      lengthCm: packages.lengthCm,
      widthCm: packages.widthCm,
      heightCm: packages.heightCm,
      volumetricWeightKg: packages.volumetricWeightKg,
      chargeableWeightKg: packages.chargeableWeightKg,
      
      // Status and dates
      status: packages.status,
      expectedArrivalDate: packages.expectedArrivalDate,
      receivedAt: packages.receivedAt,
      readyToShipAt: packages.readyToShipAt,
      storageExpiresAt: packages.storageExpiresAt,
      
      // Warehouse assignment
      warehouseId: packages.warehouseId,
      customerProfileId: packages.customerProfileId,
      
      // Notes and instructions
      warehouseNotes: packages.warehouseNotes,
      customerNotes: packages.customerNotes,
      specialInstructions: packages.specialInstructions,
      
      // Package characteristics
      isFragile: packages.isFragile,
      isHighValue: packages.isHighValue,
      requiresAdultSignature: packages.requiresAdultSignature,
      isRestricted: packages.isRestricted,
      
      // Customs information
      customsDeclaration: packages.customsDeclaration,
      customsValue: packages.customsValue,
      customsValueCurrency: packages.customsValueCurrency,
      countryOfOrigin: packages.countryOfOrigin,
      hsCode: packages.hsCode,
      
      // Pre-receiving workflow
      incomingShipmentItemId: packages.incomingShipmentItemId,
      
      // Processing info
      processedBy: packages.processedBy,
      processedAt: packages.processedAt,
      createdAt: packages.createdAt,
      updatedAt: packages.updatedAt,
      
      // Customer info
      customerId: customerProfiles.id,
      customerName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
      customerEmail: users.email,
      customerPhone: users.phone,
      
      // Warehouse info
      warehouseName: warehouses.name,
      warehouseCode: warehouses.code,
      warehouseCity: warehouses.city,
      warehouseCountryCode: warehouses.countryCode,
      
      // Courier info (from incoming shipment)
      courierName: couriers.name,
      batchReference: incomingShipments.batchReference,
      
      // Processed by user (would need another join for users table with alias)
      processedByName: sql<string>`NULL`,
      processedByEmail: sql<string>`NULL`,
    })
    .from(packages)
    .innerJoin(customerProfiles, eq(packages.customerProfileId, customerProfiles.id))
    .innerJoin(users, eq(customerProfiles.userId, users.id))
    .leftJoin(warehouses, eq(packages.warehouseId, warehouses.id))
    .leftJoin(incomingShipmentItems, eq(packages.incomingShipmentItemId, incomingShipmentItems.id))
    .leftJoin(incomingShipments, eq(incomingShipmentItems.incomingShipmentId, incomingShipments.id))
    .leftJoin(couriers, eq(incomingShipments.courierId, couriers.id))
    .where(whereClause)
    .orderBy(desc(packages.createdAt))
    .limit(limit)
    .offset(offset);

  // Get total count for pagination
  const [{ count }] = await db
    .select({ count: countFn() })
    .from(packages)
    .innerJoin(customerProfiles, eq(packages.customerProfileId, customerProfiles.id))
    .innerJoin(users, eq(customerProfiles.userId, users.id))
    .leftJoin(warehouses, eq(packages.warehouseId, warehouses.id))
    .leftJoin(incomingShipmentItems, eq(packages.incomingShipmentItemId, incomingShipmentItems.id))
    .leftJoin(incomingShipments, eq(incomingShipmentItems.incomingShipmentId, incomingShipments.id))
    .leftJoin(couriers, eq(incomingShipments.courierId, couriers.id))
    .where(whereClause);

  // Format packages with proper type conversion
  const formattedPackages: PackageWithDetails[] = packagesQuery.map(pkg => ({
    // Base package data
    id: pkg.id,
    tenantId: pkg.tenantId,
    internalId: pkg.internalId || '',
    trackingNumberInbound: pkg.trackingNumberInbound || '',
    trackingNumberOutbound: pkg.trackingNumberOutbound || '',
    
    // Package details
    description: pkg.description || '',
    
    // Physical characteristics with proper number conversion
    weightKg: pkg.weightKg ? parseFloat(pkg.weightKg.toString()) : null,
    lengthCm: pkg.lengthCm ? parseFloat(pkg.lengthCm.toString()) : null,
    widthCm: pkg.widthCm ? parseFloat(pkg.widthCm.toString()) : null,
    heightCm: pkg.heightCm ? parseFloat(pkg.heightCm.toString()) : null,
    volumetricWeightKg: pkg.volumetricWeightKg ? parseFloat(pkg.volumetricWeightKg.toString()) : null,
    chargeableWeightKg: pkg.chargeableWeightKg ? parseFloat(pkg.chargeableWeightKg.toString()) : null,
    
    // Status and dates
    status: pkg.status as PackageStatus,
    expectedArrivalDate: pkg.expectedArrivalDate,
    receivedAt: pkg.receivedAt,
    readyToShipAt: pkg.readyToShipAt,
    storageExpiresAt: pkg.storageExpiresAt,
    
    // Warehouse assignment
    warehouseId: pkg.warehouseId,
    customerProfileId: pkg.customerProfileId,
    
    // Notes and instructions
    warehouseNotes: pkg.warehouseNotes || '',
    customerNotes: pkg.customerNotes || '',
    specialInstructions: pkg.specialInstructions || '',
    
    // Package characteristics
    isFragile: pkg.isFragile || false,
    isHighValue: pkg.isHighValue || false,
    requiresAdultSignature: pkg.requiresAdultSignature || false,
    isRestricted: pkg.isRestricted || false,
    
    // Customs information
    customsDeclaration: pkg.customsDeclaration || '',
    customsValue: pkg.customsValue ? parseFloat(pkg.customsValue.toString()) : null,
    customsValueCurrency: pkg.customsValueCurrency || '',
    countryOfOrigin: pkg.countryOfOrigin || '',
    hsCode: pkg.hsCode || '',
    
    // Pre-receiving workflow
    incomingShipmentItemId: pkg.incomingShipmentItemId,
    
    // Processing info
    processedBy: pkg.processedBy,
    processedAt: pkg.processedAt,
    createdAt: pkg.createdAt,
    updatedAt: pkg.updatedAt,
    
    // Enhanced fields
    customerId: pkg.customerId || '',
    customerName: pkg.customerName || '',
    customerEmail: pkg.customerEmail || '',
    customerPhone: pkg.customerPhone || '',
    
    warehouseName: pkg.warehouseName || '',
    warehouseCode: pkg.warehouseCode || '',
    warehouseCity: pkg.warehouseCity || '',
    warehouseCountryCode: pkg.warehouseCountryCode || '',
    
    courierName: pkg.courierName || '',
    batchReference: pkg.batchReference || '',
    
    processedByName: pkg.processedByName || '',
    processedByEmail: pkg.processedByEmail || '',
    
    // Calculate dimensional weight for display if dimensions exist
    calculatedVolumetricWeight: pkg.lengthCm && pkg.widthCm && pkg.heightCm 
      ? (Number(pkg.lengthCm) * Number(pkg.widthCm) * Number(pkg.heightCm)) / 5000 
      : null,
  }));

  return {
    data: formattedPackages,
    pagination: {
      page,
      limit,
      total: Number(count),
      pages: Math.ceil(Number(count) / limit),
    },
  };
}