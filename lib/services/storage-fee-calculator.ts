// lib/services/storage-fee-calculator.ts

import { db } from '@/lib/db/drizzle';
import { 
  storagePricing, 
  binLocations, 
  packageBinAssignments 
} from '@/lib/db/schema';
import { eq, and, isNull, gte, lte, or } from 'drizzle-orm';

export interface StorageFeeInput {
  packages: Array<{
    id: string;
    warehouseId: string;
    receivedAt: Date | null;
  }>;
  tenantId: string;
  calculationDate?: Date;
}

export interface StorageFeeBreakdown {
  packageId: string;
  internalId?: string;
  daysStored: number;
  freeDaysUsed: number;
  chargeableDays: number;
  dailyRate: number;
  binLocationCost: number;
  packageStorageFee: number;
  binLocation?: string;
}

export interface StorageFeeResult {
  totalStorageFee: number;
  breakdown: StorageFeeBreakdown[];
  currency: string;
}

export class StorageFeeCalculator {
  /**
   * Calculate storage fees for packages
   */
  static async calculateStorageFees(input: StorageFeeInput): Promise<StorageFeeResult> {
    const { packages, tenantId, calculationDate = new Date() } = input;
    const breakdown: StorageFeeBreakdown[] = [];
    let totalStorageFee = 0;

    // Get storage pricing configuration for the tenant
    const storagePricingQuery = await db
      .select({
        id: storagePricing.id,
        freeDays: storagePricing.freeDays,
        dailyRateAfterFree: storagePricing.dailyRateAfterFree,
        currency: storagePricing.currency,
        isActive: storagePricing.isActive
      })
      .from(storagePricing)
      .where(
        and(
          eq(storagePricing.tenantId, tenantId),
          eq(storagePricing.isActive, true),
          lte(storagePricing.effectiveFrom, calculationDate.toISOString().split('T')[0]),
          or(
            isNull(storagePricing.effectiveUntil),
            gte(storagePricing.effectiveUntil, calculationDate.toISOString().split('T')[0])
          )
        )
      )
      .limit(1);

    // Default storage pricing if not configured
    const defaultStoragePricing = {
      freeDays: 7, // 7 free days
      dailyRateAfterFree: 2.00, // $2 per day after free period
      currency: 'USD'
    };

    const pricing = storagePricingQuery.length > 0 
      ? {
        ...storagePricingQuery[0],
        dailyRateAfterFree: typeof storagePricingQuery[0].dailyRateAfterFree === 'string' 
          ? parseFloat(storagePricingQuery[0].dailyRateAfterFree) 
          : storagePricingQuery[0].dailyRateAfterFree
      } 
      : defaultStoragePricing;

    // Calculate storage fee for each package
    for (const pkg of packages) {
      const packageBreakdown = await this.calculatePackageStorageFee(
        pkg,
        pricing,
        calculationDate,
        tenantId
      );
      
      breakdown.push(packageBreakdown);
      totalStorageFee += packageBreakdown.packageStorageFee;
    }

    return {
      totalStorageFee: Math.round(totalStorageFee * 100) / 100, // Round to 2 decimal places
      breakdown,
      currency: pricing.currency || 'USD'
    };
  }

  /**
   * Calculate storage fee for a single package
   */
  private static async calculatePackageStorageFee(
    pkg: { id: string; warehouseId: string; receivedAt: Date | null; internalId?: string },
    pricing: { freeDays: number; dailyRateAfterFree: number; currency?: string },
    calculationDate: Date,
    tenantId: string
  ): Promise<StorageFeeBreakdown> {
    
    // Calculate days stored
    const receivedDate = pkg.receivedAt || new Date();
    const daysStored = Math.max(0, Math.floor(
      (calculationDate.getTime() - receivedDate.getTime()) / (1000 * 60 * 60 * 24)
    ));

    // Calculate chargeable days (days beyond free period)
    const freeDaysUsed = Math.min(daysStored, pricing.freeDays);
    const chargeableDays = Math.max(0, daysStored - pricing.freeDays);

    // Get bin location cost (if assigned to a premium bin)
    const binLocationCost = await this.getBinLocationCost(pkg.id, tenantId);
    
    // Calculate base storage fee
    const baseStorageFee = chargeableDays * pricing.dailyRateAfterFree;
    
    // Total package storage fee includes bin location premium
    const packageStorageFee = baseStorageFee + binLocationCost;

    // Get bin location info
    const binLocation = await this.getPackageBinLocation(pkg.id);

    return {
      packageId: pkg.id,
      internalId: pkg.internalId,
      daysStored,
      freeDaysUsed,
      chargeableDays,
      dailyRate: pricing.dailyRateAfterFree,
      binLocationCost,
      packageStorageFee,
      binLocation
    };
  }

  /**
   * Get bin location cost for a package
   */
  private static async getBinLocationCost(packageId: string, tenantId: string): Promise<number> {
    try {
      const binAssignmentQuery = await db
        .select({
          binId: packageBinAssignments.binId,
          assignedAt: packageBinAssignments.assignedAt
        })
        .from(packageBinAssignments)
        .where(
          and(
            eq(packageBinAssignments.packageId, packageId),
            isNull(packageBinAssignments.removedAt)
          )
        )
        .limit(1);

      if (binAssignmentQuery.length === 0) {
        return 0; // No bin assignment, no additional cost
      }

      const binAssignment = binAssignmentQuery[0];

      // Get bin location pricing
      const binLocationQuery = await db
        .select({
          dailyPremium: binLocations.dailyPremium,
          currency: binLocations.currency
        })
        .from(binLocations)
        .where(
          and(
            eq(binLocations.id, binAssignment.binId),
            eq(binLocations.tenantId, tenantId),
            eq(binLocations.isActive, true)
          )
        )
        .limit(1);

      if (binLocationQuery.length === 0) {
        return 0; // Bin not found or inactive
      }

      const binLocation = binLocationQuery[0];
      const dailyPremium = parseFloat(binLocation.dailyPremium || '0');

      if (dailyPremium <= 0) {
        return 0; // No premium for this bin
      }

      // Calculate days the package has been in this bin
      const assignedDate = new Date(binAssignment.assignedAt);
      const today = new Date();
      const daysInBin = Math.max(0, Math.floor(
        (today.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24)
      ));

      return daysInBin * dailyPremium;

    } catch (error) {
      console.error('Error calculating bin location cost:', error);
      return 0;
    }
  }

  /**
   * Get package bin location info
   */
  private static async getPackageBinLocation(packageId: string): Promise<string | undefined> {
    try {
      const binAssignmentQuery = await db
        .select({
          binCode: binLocations.binCode,
          zoneName: binLocations.zoneName
        })
        .from(packageBinAssignments)
        .innerJoin(binLocations, eq(packageBinAssignments.binId, binLocations.id))
        .where(
          and(
            eq(packageBinAssignments.packageId, packageId),
            isNull(packageBinAssignments.removedAt)
          )
        )
        .limit(1);

      if (binAssignmentQuery.length > 0) {
        const bin = binAssignmentQuery[0];
        return `${bin.zoneName}-${bin.binCode}`;
      }

      return undefined;
    } catch (error) {
      console.error('Error getting package bin location:', error);
      return undefined;
    }
  }

  /**
   * Get estimated storage fee for quote purposes
   */
  static async getEstimatedStorageFee(
    packageIds: string[],
    tenantId: string,
    projectedDays: number = 0
  ): Promise<{ estimatedFee: number; currency: string }> {
    // Get storage pricing
    const today = new Date();
    const storagePricingQuery = await db
      .select({
        freeDays: storagePricing.freeDays,
        dailyRateAfterFree: storagePricing.dailyRateAfterFree,
        currency: storagePricing.currency
      })
      .from(storagePricing)
      .where(
        and(
          eq(storagePricing.tenantId, tenantId),
          eq(storagePricing.isActive, true),
          lte(storagePricing.effectiveFrom, today.toISOString().split('T')[0])
        )
      )
      .limit(1);

    const pricing = storagePricingQuery.length > 0 
      ? {
        ...storagePricingQuery[0],
        dailyRateAfterFree: typeof storagePricingQuery[0].dailyRateAfterFree === 'string' 
          ? parseFloat(storagePricingQuery[0].dailyRateAfterFree) 
          : storagePricingQuery[0].dailyRateAfterFree
      }
      : { freeDays: 7, dailyRateAfterFree: 2.00, currency: 'USD' };

    // Simple estimation: assume packages will be charged for projected days beyond free period
    const chargeableDays = Math.max(0, projectedDays - pricing.freeDays);
    const estimatedFee = packageIds.length * chargeableDays * pricing.dailyRateAfterFree;

    return {
      estimatedFee: Math.round(estimatedFee * 100) / 100,
      currency: pricing.currency || 'USD'
    };
  }
}