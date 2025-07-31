// features/shipping/types/zone.types.ts

export interface Zone {
    id: string;
    tenantId: string;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    countries?: ZoneCountry[];
    countryCount: number;
  }
  
  export interface ZoneCountry {
    id: string;
    zoneId: string;
    countryCode: string;
    createdAt: string;
    country?: {
      code: string;
      name: string;
    };
  }
  
  export interface ZoneFilters {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }
  
  export interface CreateZoneData {
    name: string;
    description?: string;
    isActive?: boolean;
    countries: string[];
  }
  
  export interface UpdateZoneData {
    name?: string;
    description?: string;
    isActive?: boolean;
    countries?: string[];
  }
  
  export interface ZoneStatistics {
    totalZones: number;
    activeZones: number;
    totalCountries: number;
    averageCountriesPerZone: number;
    mostPopularCountries: Array<{
      countryCode: string;
      countryName: string;
      zoneCount: number;
    }>;
  }
  
  export interface Country {
    code: string;
    name: string;
  }
  
  // Common countries for quick selection
  export const COMMON_COUNTRIES: Country[] = [
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'SA', name: 'Saudi Arabia' },
    { code: 'KW', name: 'Kuwait' },
    { code: 'QA', name: 'Qatar' },
    { code: 'BH', name: 'Bahrain' },
    { code: 'OM', name: 'Oman' },
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'BE', name: 'Belgium' },
    { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' },
    { code: 'PT', name: 'Portugal' },
    { code: 'AT', name: 'Austria' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'SG', name: 'Singapore' },
    { code: 'HK', name: 'Hong Kong' },
    { code: 'JP', name: 'Japan' },
    { code: 'AU', name: 'Australia' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'IN', name: 'India' },
    { code: 'CN', name: 'China' },
    { code: 'TH', name: 'Thailand' },
    { code: 'MY', name: 'Malaysia' },
    { code: 'PH', name: 'Philippines' },
    { code: 'VN', name: 'Vietnam' },
    { code: 'ID', name: 'Indonesia' },
    { code: 'EG', name: 'Egypt' },
    { code: 'JO', name: 'Jordan' },
    { code: 'LB', name: 'Lebanon' },
  ];