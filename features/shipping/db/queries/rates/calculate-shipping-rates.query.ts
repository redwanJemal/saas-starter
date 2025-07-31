// features/shipping/db/queries/rates/calculate-shipping-rates.query.ts

import { db } from '@/lib/db';
import { shippingRates, zones, zoneCountries } from '../../schema';
import { warehouses } from '@/features/warehouses/db/schema';
import { eq, and, or, lte, gte, isNull } from 'drizzle-orm';
import type { RateCalculationRequest, RateCalculationResult } from '../../../types/shipping.types';

export async function calculateShippingRates(
  tenantId: string,
  request: RateCalculationRequest
): Promise<RateCalculationResult[]> {
  const {
    warehouseId,
    destinationCountryCode,
    serviceType,
    weightKg,
    declaredValue = 0,
    declaredValueCurrency = 'USD'
  } = request;

  // Validate warehouse exists and belongs to tenant
  const warehouse = await db
    .select()
    .from(warehouses)
    .where(
      and(
        eq(warehouses.id, warehouseId),
        eq(warehouses.tenantId, tenantId)
      )
    )
    .limit(1);

  if (warehouse.length === 0) {
    throw new Error('Warehouse not found');
  }

  // Find zones that contain the destination country
  const zonesForCountry = await db
    .select({
      zoneId: zones.id,
      zoneName: zones.name,
    })
    .from(zones)
    .innerJoin(zoneCountries, eq(zones.id, zoneCountries.zoneId))
    .where(
      and(
        eq(zones.tenantId, tenantId),
        eq(zones.isActive, true),
        eq(zoneCountries.countryCode, destinationCountryCode.toUpperCase())
      )
    );

  if (zonesForCountry.length === 0) {
    return []; // No zones configured for this destination
  }

  const zoneIds = zonesForCountry.map(z => z.zoneId);
  const currentDate = new Date();
  const currentDateStr = currentDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD

  // Build where conditions for rates
  let rateConditions = [
    eq(shippingRates.tenantId, tenantId),
    eq(shippingRates.warehouseId, warehouseId),
    eq(shippingRates.isActive, true),
    lte(shippingRates.effectiveFrom, currentDateStr),
    or(
      isNull(shippingRates.effectiveUntil),
      gte(shippingRates.effectiveUntil, currentDateStr)
    )
  ];

  // Add zone filter
  if (zoneIds.length === 1) {
    rateConditions.push(eq(shippingRates.zoneId, zoneIds[0]));
  } else {
    rateConditions.push(or(...zoneIds.map(zoneId => eq(shippingRates.zoneId, zoneId))));
  }

  // Add service type filter if specified
  if (serviceType) {
    rateConditions.push(eq(shippingRates.serviceType, serviceType));
  }

  // Add weight filter (if maxWeightKg is specified)
  rateConditions.push(
    or(
      isNull(shippingRates.maxWeightKg),
      gte(shippingRates.maxWeightKg, weightKg.toString())
    )
  );

  // Get applicable rates
  const applicableRates = await db
    .select({
      id: shippingRates.id,
      zoneId: shippingRates.zoneId,
      serviceType: shippingRates.serviceType,
      baseRate: shippingRates.baseRate,
      perKgRate: shippingRates.perKgRate,
      minCharge: shippingRates.minCharge,
      maxWeightKg: shippingRates.maxWeightKg,
      currencyCode: shippingRates.currencyCode,
      effectiveUntil: shippingRates.effectiveUntil,
      zoneName: zones.name,
    })
    .from(shippingRates)
    .innerJoin(zones, eq(shippingRates.zoneId, zones.id))
    .where(and(...rateConditions))
    .orderBy(shippingRates.serviceType, shippingRates.baseRate);

  // Calculate costs for each applicable rate
  const results: RateCalculationResult[] = applicableRates.map(rate => {
    const baseRate = parseFloat(rate.baseRate);
    const perKgRate = parseFloat(rate.perKgRate);
    const minCharge = parseFloat(rate.minCharge);
    
    // Calculate weight-based charge
    const weightCharge = weightKg * perKgRate;
    
    // Apply minimum charge if needed
    const subtotalBeforeMin = baseRate + weightCharge;
    const appliedRate = Math.max(subtotalBeforeMin, minCharge);
    
    // Calculate insurance (simple example: 1% of declared value, minimum $5)
    const insuranceRate = Math.max(declaredValue * 0.01, 5);
    
    // Handling fee (flat rate example)
    const handlingFee = 10;
    
    const totalCost = appliedRate + insuranceRate + handlingFee;

    return {
      zoneId: rate.zoneId,
      zoneName: rate.zoneName,
      serviceType: rate.serviceType as any,
      baseRate: rate.baseRate,
      perKgRate: rate.perKgRate,
      weightCharge: weightCharge.toFixed(2),
      subtotal: appliedRate.toFixed(2),
      insuranceCost: insuranceRate.toFixed(2),
      handlingFee: handlingFee.toFixed(2),
      totalCost: totalCost.toFixed(2),
      currency: rate.currencyCode,
      effectiveUntil: rate.effectiveUntil?.toString().split('T')[0],
      rateId: rate.id,
      calculationDetails: {
        weight: weightKg,
        baseRate,
        perKgRate,
        weightCharge,
        minCharge,
        appliedRate,
      },
    };
  });

  return results;
}