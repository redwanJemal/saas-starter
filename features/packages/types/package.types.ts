// features/packages/types/package.types.ts

import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type { packages, packageStatusHistory, incomingShipments, incomingShipmentItems, packageDocuments } from '@/features/packages/db/schema';

// ============================================================================
// BASE TYPES FROM SCHEMA
// ============================================================================

export type Package = InferSelectModel<typeof packages>;
export type NewPackage = InferInsertModel<typeof packages>;
export type PackageStatusHistory = InferSelectModel<typeof packageStatusHistory>;
export type PackageDocument = InferSelectModel<typeof packageDocuments>;
export type IncomingShipment = InferSelectModel<typeof incomingShipments>;
export type IncomingShipmentItem = InferSelectModel<typeof incomingShipmentItems>;

// Package status enum
export type PackageStatus = 
  | 'expected' 
  | 'received' 
  | 'processing' 
  | 'ready_to_ship' 
  | 'shipped' 
  | 'delivered' 
  | 'returned' 
  | 'disposed' 
  | 'missing' 
  | 'damaged' 
  | 'held';

// Incoming shipment status enum
export type IncomingShipmentStatus = 
  | 'pending' 
  | 'scanning' 
  | 'scanned' 
  | 'assigned' 
  | 'received' 
  | 'expected';

// Item assignment status enum
export type ItemAssignmentStatus = 
  | 'unassigned' 
  | 'assigned' 
  | 'received';

// ============================================================================
// ENHANCED TYPES WITH RELATIONSHIPS
// ============================================================================

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
}

export interface PackageWithHistory extends PackageWithDetails {
  statusHistory: Array<{
    id: string;
    fromStatus: PackageStatus | null;
    toStatus: PackageStatus;
    changeReason?: string;
    createdAt: Date;
    changedByName?: string;
    changedByEmail?: string;
  }>;
  
  documents: Array<{
    id: string;
    documentType: string;
    isPrimary: boolean;
    displayOrder: number;
    attachedAt: Date;
    // Document details
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

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface PackageFilters {
  search?: string;
  status?: PackageStatus;
  warehouseId?: string;
  customerId?: string;
  customerProfileId?: string;
  dateFrom?: string;
  dateTo?: string;
  senderName?: string;
  trackingNumber?: string;
  isHighValue?: boolean;
  isFragile?: boolean;
  isRestricted?: boolean;
  hasDocuments?: boolean;
  internalId?: string;
  suiteCode?: string;
  courierName?: string;
  batchReference?: string;
  estimatedValueMin?: number;
  estimatedValueMax?: number;
  weightMin?: number;
  weightMax?: number;
  page?: number;
  limit?: number;
}

export interface IncomingShipmentFilters {
  search?: string;
  status?: IncomingShipmentStatus;
  warehouseId?: string;
  courierId?: string;
  courierName?: string;
  batchReference?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface CreatePackageData {
  // Customer reference
  customerProfileId: string;
  suiteCodeCaptured?: string;
  
  // Package identification
  internalId?: string;
  trackingNumberInbound?: string;
  trackingNumberOutbound?: string;
  
  // Sender information
  senderName?: string;
  senderCompany?: string;
  senderAddress?: string;
  senderCity?: string;
  senderCountryCode?: string;
  senderPostalCode?: string;
  senderPhone?: string;
  senderEmail?: string;
  senderTrackingUrl?: string;
  
  // Package details
  description?: string;
  estimatedValue?: number;
  estimatedValueCurrency?: string;
  
  // Physical characteristics
  weightActualKg?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  volumetricWeightKg?: number;
  chargeableWeightKg?: number;
  
  // Status and dates
  status?: PackageStatus;
  statusNotes?: string;
  expectedArrivalDate?: string;
  receivedAt?: string;
  readyToShipAt?: string;
  storageExpiresAt?: string;
  
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
}

export interface UpdatePackageData extends Partial<CreatePackageData> {
  processedBy?: string;
  processedAt?: string;
}

export interface BulkPackageAction {
  packageIds: string[];
  action: 'update_status' | 'assign_warehouse' | 'add_note' | 'mark_ready' | 'delete';
  data?: {
    status?: PackageStatus;
    warehouseId?: string;
    notes?: string;
    reason?: string;
  };
}

export interface PackageStatusUpdate {
  packageId: string;
  status: PackageStatus;
  reason?: string;
  notes?: string;
}

export interface BulkStatusUpdate {
  updates: PackageStatusUpdate[];
}

// ============================================================================
// INCOMING SHIPMENT TYPES
// ============================================================================

export interface IncomingShipmentWithItems extends IncomingShipment {
  items: Array<IncomingShipmentItem & {
    package?: PackageWithDetails;
    assignedToCustomer?: {
      customerId: string;
      customerName: string;
      customerEmail: string;
    };
  }>;
  courier?: {
    id: string;
    name: string;
    code: string;
  };
  warehouse?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface CreateIncomingShipmentData {
  tenantId: string;
  warehouseId: string;
  batchReference: string;
  courierId?: string;
  courierName?: string;
  trackingNumbers?: string[];
  arrivalDate?: string;
  expectedArrivalDate?: string;
  actualArrivalDate?: string;
  status?: IncomingShipmentStatus;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface UpdateIncomingShipmentData extends Partial<CreateIncomingShipmentData> {}

export interface CreateIncomingShipmentItemData {
  incomingShipmentId: string;
  itemReference: string;
  scannedTrackingNumber?: string;
  estimatedWeight?: number;
  actualWeight?: number;
  dimensions?: string;
  description?: string;
  senderInfo?: string;
  assignmentStatus?: ItemAssignmentStatus;
  assignedToCustomerProfileId?: string;
  assignedAt?: string;
  assignedBy?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface UpdateIncomingShipmentItemData extends Partial<CreateIncomingShipmentItemData> {}

// ============================================================================
// PACKAGE STATISTICS
// ============================================================================

export interface PackageStatistics {
  total: number;
  byStatus: Record<PackageStatus, number>;
  byWarehouse: Array<{
    warehouseId: string;
    warehouseName: string;
    count: number;
  }>;
  recentActivity: Array<{
    date: string;
    received: number;
    shipped: number;
  }>;
  highValue: number;
  fragile: number;
  restricted: number;
  averageProcessingTime: number; // in hours
  storageAlerts: number; // packages nearing storage expiry
}

// ============================================================================
// DOCUMENT MANAGEMENT
// ============================================================================

export interface AttachDocumentData {
  documentId: string;
  documentType: string;
  isPrimary?: boolean;
  displayOrder?: number;
}

export interface PackageDocumentResponse {
  id: string;
  documentType: string;
  isPrimary: boolean;
  displayOrder: number;
  attachedAt: Date;
  document: {
    id: string;
    fileName: string;
    originalFileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    isPublic: boolean;
    uploadedAt: Date;
    uploadedBy?: {
      name: string;
      email: string;
    };
  };
}

// ============================================================================
// VALIDATION SCHEMAS (for use with zod or similar)
// ============================================================================

export const PACKAGE_STATUS_OPTIONS = [
  { value: 'expected', label: 'Expected' },
  { value: 'received', label: 'Received' },
  { value: 'processing', label: 'Processing' },
  { value: 'ready_to_ship', label: 'Ready to Ship' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'returned', label: 'Returned' },
  { value: 'disposed', label: 'Disposed' },
  { value: 'missing', label: 'Missing' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'held', label: 'Held' },
] as const;

export const INCOMING_SHIPMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'scanning', label: 'Scanning' },
  { value: 'scanned', label: 'Scanned' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'received', label: 'Received' },
  { value: 'expected', label: 'Expected' },
] as const;

// ============================================================================
// ROUTE CONTEXT TYPES (for dynamic routes)
// ============================================================================

export interface IncomingShipmentRouteContext {
  params: {
    id: string;
  };
}

export interface IncomingShipmentItemRouteContext {
  params: {
    shipmentId: string;
    itemId: string;
  };
}