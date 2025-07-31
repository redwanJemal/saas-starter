
// features/shipping/db/queries/utils/transform-shipment.query.ts

import type { Shipment } from '../../../types/shipping.types';

/**
 * Transform database shipment record to frontend format
 */
export function transformShipment(shipment: any): Shipment {
  return {
    id: shipment.id,
    tenantId: shipment.tenantId,
    customerProfileId: shipment.customerProfileId,
    warehouseId: shipment.warehouseId,
    shipmentNumber: shipment.shipmentNumber,
    shippingAddressId: shipment.shippingAddressId || undefined,
    billingAddressId: shipment.billingAddressId || undefined,
    companyId: shipment.companyId || undefined,
    zoneId: shipment.zoneId || undefined,
    carrierCode: shipment.carrierCode || undefined,
    serviceType: shipment.serviceType || undefined,
    trackingNumber: shipment.trackingNumber || undefined,
    carrierReference: shipment.carrierReference || undefined,
    totalWeightKg: shipment.totalWeightKg || undefined,
    totalDeclaredValue: shipment.totalDeclaredValue || undefined,
    declaredValueCurrency: shipment.declaredValueCurrency || undefined,
    shippingCost: shipment.shippingCost || undefined,
    handlingFee: shipment.handlingFee || undefined,
    storageFee: shipment.storageFee || undefined,
    totalCost: shipment.totalCost || undefined,
    costCurrency: shipment.costCurrency || undefined,
    baseShippingRate: shipment.baseShippingRate || undefined,
    weightShippingRate: shipment.weightShippingRate || undefined,
    rateCalculationDetails: shipment.rateCalculationDetails || undefined,
    status: shipment.status,
    quoteExpiresAt: shipment.quoteExpiresAt?.toISOString() || undefined,
    paidAt: shipment.paidAt?.toISOString() || undefined,
    dispatchedAt: shipment.dispatchedAt?.toISOString() || undefined,
    estimatedDeliveryDate: shipment.estimatedDeliveryDate?.toISOString()?.split('T')[0] || undefined,
    deliveredAt: shipment.deliveredAt?.toISOString() || undefined,
    customsDeclaration: shipment.customsDeclaration || undefined,
    commercialInvoiceUrl: shipment.commercialInvoiceUrl || undefined,
    customsStatus: shipment.customsStatus || undefined,
    requiresSignature: shipment.requiresSignature || false,
    deliveryInstructions: shipment.deliveryInstructions || undefined,
    createdBy: shipment.createdBy || undefined,
    processedBy: shipment.processedBy || undefined,
    createdAt: shipment.createdAt?.toISOString() || '',
    updatedAt: shipment.updatedAt?.toISOString() || '',
    customer: shipment.customer,
    warehouse: shipment.warehouse,
    zone: shipment.zone,
    packages: shipment.packages || [],
    trackingEvents: shipment.trackingEvents || [],
    statusHistory: shipment.statusHistory || [],
  };
}