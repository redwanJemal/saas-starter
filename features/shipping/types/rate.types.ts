// features/shipping/types/rate.types.ts

export interface ShippingRate {
    id: string;
    tenantId: string;
    warehouseId: string;
    zoneId: string;
    serviceType: ServiceType;
    baseRate: number;
    perKgRate: number;
    minCharge: number;
    maxWeightKg?: number;
    currencyCode: string;
    isActive: boolean;
    effectiveFrom: string;
    effectiveUntil?: string;
    createdAt: string;
    updatedAt: string;
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
  
  export type ServiceType = 'economy' | 'standard' | 'express';
  
  export interface ShippingRateFilters {
    warehouseId?: string;
    zoneId?: string;
    serviceType?: ServiceType;
    isActive?: boolean;
    effectiveDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }
  
  export interface CreateShippingRateData {
    warehouseId: string;
    zoneId: string;
    serviceType: ServiceType;
    baseRate: number;
    perKgRate: number;
    minCharge: number;
    maxWeightKg?: number;
    currencyCode: string;
    isActive?: boolean;
    effectiveFrom: string;
    effectiveUntil?: string;
  }
  
  export interface UpdateShippingRateData {
    serviceType?: ServiceType;
    baseRate?: number;
    perKgRate?: number;
    minCharge?: number;
    maxWeightKg?: number;
    currencyCode?: string;
    isActive?: boolean;
    effectiveFrom?: string;
    effectiveUntil?: string;
  }
  
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
    totalCost: number;
    breakdown: {
      baseRate: number;
      weightCharge: number;
      minChargeApplied: boolean;
    };
    currencyCode: string;
    transitTime?: string;
    restrictions?: string[];
  }
  
  export interface ShippingRateStatistics {
    totalRates: number;
    activeRates: number;
    averageRates: {
      baseRate: number;
      perKgRate: number;
      minCharge: number;
    };
    ratesByService: Array<{
      serviceType: ServiceType;
      count: number;
      averageBaseRate: number;
    }>;
    ratesByZone: Array<{
      zoneId: string;
      zoneName: string;
      rateCount: number;
      averageRate: number;
    }>;
  }
  
  export const SERVICE_TYPES: Array<{ value: ServiceType; label: string; description: string }> = [
    { value: 'economy', label: 'Economy', description: 'Lowest cost, longer delivery time' },
    { value: 'standard', label: 'Standard', description: 'Balanced cost and delivery time' },
    { value: 'express', label: 'Express', description: 'Fastest delivery, premium pricing' },
  ];
  
  export const CURRENCY_CODES = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  ];