// features/packages/db/queries/packages/get-package-by-id.query.ts

import { db } from '@/lib/db';
import { 
  packages, 
  packageStatusHistory,
  packageDocuments,
  incomingShipmentItems, 
  incomingShipments, 
  type Package,
  type PackageStatus,
  type ItemAssignmentStatus
} from '@/features/packages/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { couriers, customerProfiles, documents, users, warehouses } from '@/lib/db/schema';

export interface PackageWithHistory extends Package {
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
  
  // Pre-receiving workflow context
  preReceivingInfo?: {
    incomingShipmentId?: string;
    itemId?: string;
    assignmentStatus?: ItemAssignmentStatus;
    expectedArrivalDate?: string;
    actualArrivalDate?: string;
    batchReference?: string;
    courierName?: string;
  };
  
  // Status history
  statusHistory: Array<{
    id: string;
    fromStatus: PackageStatus | null;
    toStatus: PackageStatus;
    changeReason?: string;
    createdAt: Date;
    changedByName?: string;
    changedByEmail?: string;
  }>;
  
  // Documents
  documents: Array<{
    id: string;
    documentType: string;
    isPrimary: boolean;
    displayOrder: number;
    attachedAt: Date;
    documentId: string;
    fileName: string;
    originalFileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    isPublic: boolean;
    uploadedAt: Date;
    uploadedByName?: string;
    uploadedByEmail?: string;
  }>;
}

export async function getPackageById(id: string): Promise<PackageWithHistory | null> {
  // Get package details with enhanced relationships
  const [packageDetails] = await db
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
      incomingShipmentId: incomingShipments.id,
      
      // Additional incoming shipment details
      expectedArrivalDateShipment: incomingShipments.expectedArrivalDate,
      actualArrivalDate: incomingShipments.actualArrivalDate,
      itemAssignmentStatus: incomingShipmentItems.assignmentStatus,
    })
    .from(packages)
    .innerJoin(customerProfiles, eq(packages.customerProfileId, customerProfiles.id))
    .innerJoin(users, eq(customerProfiles.userId, users.id))
    .leftJoin(warehouses, eq(packages.warehouseId, warehouses.id))
    .leftJoin(incomingShipmentItems, eq(packages.incomingShipmentItemId, incomingShipmentItems.id))
    .leftJoin(incomingShipments, eq(incomingShipmentItems.incomingShipmentId, incomingShipments.id))
    .leftJoin(couriers, eq(incomingShipments.courierId, couriers.id))
    .where(eq(packages.id, id))
    .limit(1);

  if (!packageDetails) {
    return null;
  }

  // Get status history with user info
  const statusHistory = await db
    .select({
      id: packageStatusHistory.id,
      fromStatus: packageStatusHistory.fromStatus,
      toStatus: packageStatusHistory.toStatus,
      changeReason: packageStatusHistory.changeReason,
      createdAt: packageStatusHistory.createdAt,
      changedByName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
      changedByEmail: users.email,
    })
    .from(packageStatusHistory)
    .leftJoin(users, eq(packageStatusHistory.changedBy, users.id))
    .where(eq(packageStatusHistory.packageId, id))
    .orderBy(desc(packageStatusHistory.createdAt));

  // Get documents with uploader details
  const packageDocs = await db
    .select({
      id: packageDocuments.id,
      documentType: packageDocuments.documentType,
      isPrimary: packageDocuments.isPrimary,
      displayOrder: packageDocuments.displayOrder,
      attachedAt: packageDocuments.attachedAt,
      
      // Document details from documents table
      documentId: documents.id,
      fileName: documents.fileName,
      originalFileName: documents.originalFileName,
      fileUrl: documents.fileUrl,
      fileSize: documents.fileSize,
      mimeType: documents.mimeType,
      isPublic: documents.isPublic,
      uploadedAt: documents.uploadedAt,
      uploadedByName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
      uploadedByEmail: users.email,
    })
    .from(packageDocuments)
    .innerJoin(documents, eq(packageDocuments.documentId, documents.id))
    .leftJoin(users, eq(documents.uploadedBy, users.id))
    .where(eq(packageDocuments.packageId, id))
    .orderBy(desc(packageDocuments.attachedAt));

  // Structure the response
  const response: PackageWithHistory = {
    // Base package data with proper type conversion
    id: packageDetails.id,
    tenantId: packageDetails.tenantId,
    internalId: packageDetails.internalId || '',
    trackingNumberInbound: packageDetails.trackingNumberInbound || '',
    trackingNumberOutbound: packageDetails.trackingNumberOutbound || '',
    
    // Customer and warehouse
    customerProfileId: packageDetails.customerProfileId,
    warehouseId: packageDetails.warehouseId,
    
    // Package details
    description: packageDetails.description || '',
    
    // Physical characteristics with proper number conversion
    weightKg: packageDetails.weightKg,
    lengthCm: packageDetails.lengthCm,
    widthCm: packageDetails.widthCm,
    heightCm: packageDetails.heightCm,
    volumetricWeightKg: packageDetails.volumetricWeightKg,
    chargeableWeightKg: packageDetails.chargeableWeightKg,
    
    // Status and dates
    status: packageDetails.status as PackageStatus,
    expectedArrivalDate: packageDetails.expectedArrivalDate,
    receivedAt: packageDetails.receivedAt,
    readyToShipAt: packageDetails.readyToShipAt,
    storageExpiresAt: packageDetails.storageExpiresAt,
    
    // Notes and instructions
    warehouseNotes: packageDetails.warehouseNotes || '',
    customerNotes: packageDetails.customerNotes || '',
    specialInstructions: packageDetails.specialInstructions || '',
    
    // Package characteristics
    isFragile: packageDetails.isFragile || false,
    isHighValue: packageDetails.isHighValue || false,
    requiresAdultSignature: packageDetails.requiresAdultSignature || false,
    isRestricted: packageDetails.isRestricted || false,
    
    // Customs information
    customsDeclaration: packageDetails.customsDeclaration || '',
    customsValue: packageDetails.customsValue,
    customsValueCurrency: packageDetails.customsValueCurrency || '',
    countryOfOrigin: packageDetails.countryOfOrigin || '',
    hsCode: packageDetails.hsCode || '',
    
    // Pre-receiving workflow
    incomingShipmentItemId: packageDetails.incomingShipmentItemId,
    
    // Processing info
    processedBy: packageDetails.processedBy,
    processedAt: packageDetails.processedAt,
    createdAt: packageDetails.createdAt,
    updatedAt: packageDetails.updatedAt,
    
    // Enhanced fields
    customerId: packageDetails.customerId || '',
    customerName: packageDetails.customerName || '',
    customerEmail: packageDetails.customerEmail || '',
    customerPhone: packageDetails.customerPhone || '',
    
    warehouseName: packageDetails.warehouseName || '',
    warehouseCode: packageDetails.warehouseCode || '',
    warehouseCity: packageDetails.warehouseCity || '',
    warehouseCountryCode: packageDetails.warehouseCountryCode || '',
    
    courierName: packageDetails.courierName || '',
    batchReference: packageDetails.batchReference || '',
    
    processedByName: '', // Would need additional join for processed by user
    processedByEmail: '', // Would need additional join for processed by user
    
    // Calculate dimensional weight for display if dimensions exist
    calculatedVolumetricWeight: packageDetails.lengthCm && packageDetails.widthCm && packageDetails.heightCm 
      ? (Number(packageDetails.lengthCm) * Number(packageDetails.widthCm) * Number(packageDetails.heightCm)) / 5000 
      : undefined,
    
    // Pre-receiving workflow context
    preReceivingInfo: packageDetails.incomingShipmentItemId ? {
      incomingShipmentId: packageDetails.incomingShipmentId || undefined,
      itemId: packageDetails.incomingShipmentItemId,
      assignmentStatus: packageDetails.itemAssignmentStatus as ItemAssignmentStatus,
      expectedArrivalDate: packageDetails.expectedArrivalDateShipment,
      actualArrivalDate: packageDetails.actualArrivalDate,
      batchReference: packageDetails.batchReference || undefined,
      courierName: packageDetails.courierName || undefined,
    } : undefined,
    
    // Status history
    statusHistory: statusHistory.map(history => ({
      id: history.id,
      fromStatus: history.fromStatus as PackageStatus,
      toStatus: history.toStatus as PackageStatus,
      changeReason: history.changeReason || '',
      createdAt: history.createdAt,
      changedByName: history.changedByName || '',
      changedByEmail: history.changedByEmail || '',
    })),
    
    // Documents
    documents: packageDocs.map(doc => ({
      id: doc.id,
      documentType: doc.documentType,
      isPrimary: doc.isPrimary,
      displayOrder: doc.displayOrder,
      attachedAt: doc.attachedAt,
      documentId: doc.documentId,
      fileName: doc.fileName,
      originalFileName: doc.originalFileName,
      fileUrl: doc.fileUrl,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      isPublic: doc.isPublic || false,
      uploadedAt: doc.uploadedAt,
      uploadedByName: doc.uploadedByName || '',
      uploadedByEmail: doc.uploadedByEmail || '',
    })),
  };

  return response;
}