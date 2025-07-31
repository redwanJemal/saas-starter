// features/shipping/types/shipping.types.ts

import type { ServiceType, ShipmentStatus } from '../db/schema';

// ============================================================================
// ZONE TYPES
// ============================================================================
export interface Zone {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Relations
  countries?: ZoneCountry[];
  countryCount?: number;
}

export interface ZoneCountry {
  id: string;
  zoneId: string;
  countryCode: string;
  createdAt: string;
  // Relations
  country?: {
    code: string;
    name: string;
    isActive: boolean;
  };
}

export interface ZoneFilters {
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateZoneData {
  name: string;
  description?: string;
  isActive?: boolean;
  countries?: string[];
}

export interface UpdateZoneData {
  name?: string;
  description?: string;
  isActive?: boolean;
  countries?: string[];
}

// ============================================================================
// SHIPPING RATE TYPES
// ============================================================================
export interface ShippingRate {
  id: string;
  tenantId: string;
  warehouseId: string;
  zoneId: string;
  serviceType: ServiceType;
  baseRate: string;
  perKgRate: string;
  minCharge: string;
  maxWeightKg?: string;
  currencyCode: string;
  isActive: boolean;
  effectiveFrom: string;
  effectiveUntil?: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  warehouse?: {
    id: string;
    name: string;
    code: string;
    city: string;
    countryCode: string;
  };
  zone?: {
    id: string;
    name: string;
    description?: string;
  };
}

export interface ShippingRateFilters {
  warehouseId?: string;
  zoneId?: string;
  serviceType?: ServiceType;
  isActive?: boolean;
  effectiveDate?: string;
  page?: number;
  limit?: number;
}

export interface CreateShippingRateData {
  warehouseId: string;
  zoneId: string;
  serviceType: ServiceType;
  baseRate: string;
  perKgRate: string;
  minCharge: string;
  maxWeightKg?: string;
  currencyCode: string;
  isActive?: boolean;
  effectiveFrom: string;
  effectiveUntil?: string;
}

export interface UpdateShippingRateData {
  warehouseId?: string;
  zoneId?: string;
  serviceType?: ServiceType;
  baseRate?: string;
  perKgRate?: string;
  minCharge?: string;
  maxWeightKg?: string;
  currencyCode?: string;
  isActive?: boolean;
  effectiveFrom?: string;
  effectiveUntil?: string;
}

// ============================================================================
// SHIPMENT TYPES
// ============================================================================
export interface Shipment {
  id: string;
  tenantId: string;
  customerProfileId: string;
  warehouseId: string;
  shipmentNumber: string;
  shippingAddressId?: string;
  billingAddressId?: string;
  companyId?: string;
  zoneId?: string;
  carrierCode?: string;
  serviceType?: string;
  trackingNumber?: string;
  carrierReference?: string;
  totalWeightKg?: string;
  totalDeclaredValue?: string;
  declaredValueCurrency?: string;
  shippingCost?: string;
  insuranceCost?: string;
  handlingFee?: string;
  storageFee?: string;
  totalCost?: string;
  costCurrency?: string;
  baseShippingRate?: string;
  weightShippingRate?: string;
  rateCalculationDetails?: Record<string, any>;
  status: ShipmentStatus;
  quoteExpiresAt?: string;
  paidAt?: string;
  dispatchedAt?: string;
  estimatedDeliveryDate?: string;
  deliveredAt?: string;
  customsDeclaration?: Record<string, any>;
  commercialInvoiceUrl?: string;
  customsStatus?: string;
  requiresSignature?: boolean;
  deliveryInstructions?: string;
  createdBy?: string;
  processedBy?: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  customer?: {
    id: string;
    name: string;
    email: string;
  };
  warehouse?: {
    id: string;
    name: string;
    code: string;
    city: string;
    countryCode: string;
  };
  zone?: {
    id: string;
    name: string;
    description?: string;
  };
  packages?: ShipmentPackage[];
  trackingEvents?: ShipmentTrackingEvent[];
  statusHistory?: ShipmentStatusHistory[];
}

export interface ShipmentPackage {
  id: string;
  shipmentId: string;
  packageId: string;
  declaredValue?: string;
  declaredDescription?: string;
  createdAt: string;
  // Relations
  package?: {
    id: string;
    internalId: string;
    trackingNumber?: string;
    description?: string;
    weight?: string;
  };
}

export interface ShipmentTrackingEvent {
  id: string;
  shipmentId: string;
  eventCode: string;
  eventDescription: string;
  location?: string;
  eventTimestamp: string;
  source?: string;
  rawData?: Record<string, any>;
  createdAt: string;
}

export interface ShipmentStatusHistory {
  id: string;
  shipmentId: string;
  status: string;
  previousStatus?: string;
  notes?: string;
  changedBy?: string;
  changedAt: string;
  trackingNumber?: string;
  carrierName?: string;
  createdAt: string;
}

export interface ShipmentFilters {
  status?: ShipmentStatus | ShipmentStatus[];
  customerProfileId?: string;
  warehouseId?: string;
  zoneId?: string;
  carrierCode?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface CreateShipmentData {
  customerProfileId: string;
  warehouseId: string;
  shippingAddressId?: string;
  billingAddressId?: string;
  companyId?: string;
  zoneId?: string;
  carrierCode?: string;
  serviceType?: string;
  totalWeightKg?: string;
  totalDeclaredValue?: string;
  declaredValueCurrency?: string;
  packageIds?: string[];
  requiresSignature?: boolean;
  deliveryInstructions?: string;
  customsDeclaration?: Record<string, any>;
}

export interface UpdateShipmentData {
  shippingAddressId?: string;
  billingAddressId?: string;
  companyId?: string;
  zoneId?: string;
  carrierCode?: string;
  serviceType?: string;
  trackingNumber?: string;
  carrierReference?: string;
  totalWeightKg?: string;
  totalDeclaredValue?: string;
  declaredValueCurrency?: string;
  shippingCost?: string;
  insuranceCost?: string;
  handlingFee?: string;
  storageFee?: string;
  totalCost?: string;
  costCurrency?: string;
  status?: ShipmentStatus;
  quoteExpiresAt?: string;
  estimatedDeliveryDate?: string;
  customsDeclaration?: Record<string, any>;
  commercialInvoiceUrl?: string;
  customsStatus?: string;
  requiresSignature?: boolean;
  deliveryInstructions?: string;
}

export interface CreateShipmentTrackingEventData {
  shipmentId: string;
  eventCode: string;
  eventDescription: string;
  location?: string;
  eventTimestamp: string;
  source?: string;
  rawData?: Record<string, any>;
}

// ============================================================================
// SHIPPING STATISTICS TYPES
// ============================================================================
export interface ShippingStatistics {
  totalZones: number;
  activeZones: number;
  totalRates: number;
  activeRates: number;
  totalShipments: number;
  activeShipments: number;
  shipmentsByStatus: Record<ShipmentStatus, number>;
  shippingCostSummary: {
    totalValue: string;
    currency: string;
    averageShippingCost: string;
  };
  recentActivity: number;
}

// ============================================================================
// RATE CALCULATION TYPES
// ============================================================================
export interface RateCalculationRequest {
  warehouseId: string;
  destinationCountryCode: string;
  serviceType?: ServiceType;
  weightKg: number;
  declaredValue?: number;
  declaredValueCurrency?: string;
}

export interface RateCalculationResult {
  zoneId: string;
  zoneName: string;
  serviceType: ServiceType;
  baseRate: string;
  perKgRate: string;
  weightCharge: string;
  subtotal: string;
  insuranceCost?: string;
  handlingFee?: string;
  totalCost: string;
  currency: string;
  effectiveUntil?: string;
  rateId: string;
  calculationDetails: {
    weight: number;
    baseRate: number;
    perKgRate: number;
    weightCharge: number;
    minCharge: number;
    appliedRate: number;
  };
}

// ============================================================================
// BULK OPERATIONS TYPES
// ============================================================================
export interface BulkShipmentUpdateData {
  shipmentIds: string[];
  status?: ShipmentStatus;
  carrierCode?: string;
  serviceType?: string;
  notes?: string;
}

export interface BulkShipmentResult {
  success: boolean;
  updated: number;
  failed: number;
  errors?: string[];
}