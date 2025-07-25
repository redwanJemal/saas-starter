// lib/services/shipping-rate-calculator.ts

import { db } from '@/lib/db/drizzle';
import { shippingRates, zones, zoneCountries, warehouses, packages, shipmentPackages } from '@/lib/db/schema';
import { eq, and, lte, or, gte, isNull, sum } from 'drizzle-orm';
import { calculateTotalChargeableWeight } from '@/lib/utils/weight-calculator';

export interface RateCalculationInput {
  warehouseId: string;
  destinationCountry: string;
  totalChargeableWeightKg?: number; // Use chargeable weight instead of total weight
  shipmentId?: string; // For calculating from existing shipment packages
  serviceType?: 'standard' | 'express' | 'economy';
  tenantId: string;
}

export interface RateCalculationResult {
  success: boolean;
  rate?: {
    id: string;
    serviceType: string;
    baseRate: number;
    perKgRate: number;
    weightCharge: number;
    totalShippingCost: number;
    minCharge: number;
    currencyCode: string;
    zoneName: string;
    warehouseName: string;
    chargeableWeightUsed: number; // Add this field
    breakdown: {
      baseRate: number;
      weightCharge: number;
      minChargeApplied: boolean;
      finalAmount: number;
      chargeableWeightKg: number; // Add this field
    };
  };
  error?: string;
  availableServices?: any[];
}

export class ShippingRateCalculator {
  /**
   * Calculate chargeable weight from shipment packages
   */
  static async calculateChargeableWeightFromShipment(shipmentId: string): Promise<number> {
    const packagesQuery = await db
      .select({
        weightActualKg: packages.weightActualKg,
        lengthCm: packages.lengthCm,
        widthCm: packages.widthCm,
        heightCm: packages.heightCm,
        volumetricWeightKg: packages.volumetricWeightKg,
        chargeableWeightKg: packages.chargeableWeightKg,
      })
      .from(shipmentPackages)
      .innerJoin(packages, eq(shipmentPackages.packageId, packages.id))
      .where(eq(shipmentPackages.shipmentId, shipmentId));

    // If packages have pre-calculated chargeable weight, use it
    const totalChargeableFromDB = packagesQuery.reduce((total, pkg) => {
      if (pkg.chargeableWeightKg) {
        return total + parseFloat(pkg.chargeableWeightKg);
      }
      return total;
    }, 0);

    if (totalChargeableFromDB > 0) {
      return totalChargeableFromDB;
    }

    // Otherwise, calculate chargeable weight from package data
    return calculateTotalChargeableWeight(packagesQuery);
  }

  /**
   * Find zone by destination country
   */
  static async findZoneByCountry(tenantId: string, countryCode: string): Promise<string | null> {
    try {
      const zoneQuery = await db
        .select({
          zoneId: zones.id,
        })
        .from(zones)
        .innerJoin(zoneCountries, eq(zones.id, zoneCountries.zoneId))
        .where(
          and(
            eq(zones.tenantId, tenantId),
            eq(zoneCountries.countryCode, countryCode),
            eq(zones.isActive, true)
          )
        )
        .limit(1);

      return zoneQuery.length > 0 ? zoneQuery[0].zoneId : null;
    } catch (error) {
      console.error('Error finding zone by country:', error);
      return null;
    }
  }

  /**
   * Calculate shipping rate using chargeable weight
   */
  static async calculateRate(input: RateCalculationInput): Promise<RateCalculationResult> {
    try {
      const { warehouseId, destinationCountry, serviceType = 'standard', tenantId } = input;

      let totalChargeableWeightKg = input.totalChargeableWeightKg || 0;

      // If shipmentId is provided, calculate chargeable weight from packages
      if (input.shipmentId && totalChargeableWeightKg <= 0) {
        totalChargeableWeightKg = await this.calculateChargeableWeightFromShipment(input.shipmentId);
      }

      if (totalChargeableWeightKg <= 0) {
        return {
          success: false,
          error: 'No chargeable weight information found'
        };
      }

      // Find the zone for the destination country
      const zoneId = await this.findZoneByCountry(tenantId, destinationCountry);
      if (!zoneId) {
        return {
          success: false,
          error: `No shipping zone found for destination country: ${destinationCountry}`
        };
      }

      // Get current date for rate validation
      const today = new Date().toISOString().split('T')[0];

      // Find active shipping rate
      const rateQuery = await db
        .select({
          id: shippingRates.id,
          serviceType: shippingRates.serviceType,
          baseRate: shippingRates.baseRate,
          perKgRate: shippingRates.perKgRate,
          minCharge: shippingRates.minCharge,
          maxWeightKg: shippingRates.maxWeightKg,
          currencyCode: shippingRates.currencyCode,
          zoneName: zones.name,
          warehouseName: warehouses.name,
        })
        .from(shippingRates)
        .innerJoin(zones, eq(shippingRates.zoneId, zones.id))
        .innerJoin(warehouses, eq(shippingRates.warehouseId, warehouses.id))
        .where(
          and(
            eq(shippingRates.tenantId, tenantId),
            eq(shippingRates.warehouseId, warehouseId),
            eq(shippingRates.zoneId, zoneId),
            eq(shippingRates.serviceType, serviceType),
            eq(shippingRates.isActive, true),
            lte(shippingRates.effectiveFrom, today),
            or(
              isNull(shippingRates.effectiveUntil),
              gte(shippingRates.effectiveUntil, today)
            )
          )
        )
        .limit(1);

      if (rateQuery.length === 0) {
        return {
          success: false,
          error: `No active ${serviceType} shipping rate found for this route`
        };
      }

      const rate = rateQuery[0];

      // Check weight limits
      if (rate.maxWeightKg && totalChargeableWeightKg > parseFloat(rate.maxWeightKg)) {
        return {
          success: false,
          error: `Chargeable weight exceeds maximum limit of ${rate.maxWeightKg}kg for ${serviceType} service`
        };
      }

      // Calculate shipping cost using chargeable weight
      const baseRate = parseFloat(rate.baseRate);
      const perKgRate = parseFloat(rate.perKgRate);
      const minCharge = parseFloat(rate.minCharge);
      const weightCharge = totalChargeableWeightKg * perKgRate;
      const calculatedTotal = baseRate + weightCharge;
      const totalShippingCost = Math.max(calculatedTotal, minCharge);
      const minChargeApplied = calculatedTotal < minCharge;

      return {
        success: true,
        rate: {
          id: rate.id,
          serviceType: rate.serviceType,
          baseRate,
          perKgRate,
          weightCharge,
          totalShippingCost,
          minCharge,
          currencyCode: rate.currencyCode,
          zoneName: rate.zoneName,
          warehouseName: rate.warehouseName,
          chargeableWeightUsed: totalChargeableWeightKg,
          breakdown: {
            baseRate,
            weightCharge,
            minChargeApplied,
            finalAmount: totalShippingCost,
            chargeableWeightKg: totalChargeableWeightKg,
          },
        },
      };
    } catch (error) {
      console.error('Error calculating shipping rate:', error);
      return {
        success: false,
        error: 'Failed to calculate shipping rate'
      };
    }
  }

  /**
   * Get available services for a route
   */
  static async getAvailableServices(input: {
    warehouseId: string;
    destinationCountry: string;
    totalChargeableWeightKg?: number;
    shipmentId?: string;
    tenantId: string;
  }): Promise<{ availableServices: any[] }> {
    try {
      const services = ['standard', 'express', 'economy'];
      const availableServices = [];

      for (const serviceType of services) {
        const result = await this.calculateRate({
          ...input,
          serviceType: serviceType as 'standard' | 'express' | 'economy',
        });

        if (result.success && result.rate) {
          availableServices.push({
            serviceType,
            rate: result.rate,
          });
        }
      }

      return { availableServices };
    } catch (error) {
      console.error('Error getting available services:', error);
      return { availableServices: [] };
    }
  }
}