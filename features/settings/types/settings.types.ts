// features/settings/types/settings.types.ts
import type { 
    Country as SchemaCountry,
    Currency as SchemaCurrency,
    Courier as SchemaCourier,
    TenantCurrency as SchemaTenantCurrency,
    TenantCourier as SchemaTenantCourier,
    NewCountry as SchemaNewCountry,
    NewCurrency as SchemaNewCurrency,
    NewCourier as SchemaNewCourier,
    CountryFilters as SchemaCountryFilters,
    CurrencyFilters as SchemaCurrencyFilters,
    CourierFilters as SchemaCourierFilters
  } from '@/features/settings/db/schema';
  
  // Re-export schema types
  export type Country = SchemaCountry;
  export type Currency = SchemaCurrency;
  export type Courier = SchemaCourier;
  export type TenantCurrency = SchemaTenantCurrency;
  export type TenantCourier = SchemaTenantCourier;
  
  // Create/Update types
  export type NewCountry = SchemaNewCountry;
  export type NewCurrency = SchemaNewCurrency;
  export type NewCourier = SchemaNewCourier;
  
  export interface UpdateCountryData {
    code?: string;
    name?: string;
    region?: string;
    subregion?: string;
    isActive?: boolean;
    isShippingEnabled?: boolean;
    requiresPostalCode?: boolean;
    requiresStateProvince?: boolean;
    euMember?: boolean;
    customsFormType?: string;
    flagEmoji?: string;
    phonePrefix?: string;
  }
  
  export interface UpdateCurrencyData {
    code?: string;
    name?: string;
    symbol?: string;
    isActive?: boolean;
    decimalPlaces?: number;
    symbolPosition?: string;
  }
  
  export interface UpdateCourierData {
    code?: string;
    name?: string;
    website?: string;
    trackingUrlTemplate?: string;
    isActive?: boolean;
    apiCredentials?: Record<string, any>;
    integrationSettings?: Record<string, any>;
  }
  
  // Filter types
  export type CountryFilters = SchemaCountryFilters;
  export type CurrencyFilters = SchemaCurrencyFilters;
  export type CourierFilters = SchemaCourierFilters;
  
  // Tenant configuration types
  export interface CreateTenantCurrencyData {
    currencyId: string;
    isDefault?: boolean;
    exchangeRate?: string;
  }
  
  export interface UpdateTenantCurrencyData {
    isDefault?: boolean;
    exchangeRate?: string;
  }
  
  export interface CreateTenantCourierData {
    courierId: string;
    isActive?: boolean;
    contractDetails?: Record<string, any>;
    apiCredentials?: Record<string, any>;
  }
  
  export interface UpdateTenantCourierData {
    isActive?: boolean;
    contractDetails?: Record<string, any>;
    apiCredentials?: Record<string, any>;
  }
  
  // Statistics and aggregation types
  export interface CountryStatistics {
    id: string;
    name: string;
    code: string;
    warehouseCount: number;
    customerCount: number;
    packageCount: number;
    shippingEnabled: boolean;
  }
  
  export interface CurrencyStatistics {
    id: string;
    name: string;
    code: string;
    symbol: string;
    tenantCount: number;
    isDefault: boolean;
    exchangeRate: string;
  }
  
  export interface CourierStatistics {
    id: string;
    name: string;
    code: string;
    tenantCount: number;
    packageCount: number;
    isActive: boolean;
  }
  
  // API Response types
  export interface CountriesResponse {
    data: Country[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }
  
  export interface CurrenciesResponse {
    data: Currency[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }
  
  export interface CouriersResponse {
    data: Courier[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }
  
  // Form data types for components
  export interface CountryFormData {
    code: string;
    name: string;
    region?: string;
    subregion?: string;
    isActive: boolean;
    isShippingEnabled: boolean;
    requiresPostalCode: boolean;
    requiresStateProvince: boolean;
    euMember: boolean;
    customsFormType?: string;
    flagEmoji?: string;
    phonePrefix?: string;
  }
  
  export interface CurrencyFormData {
    code: string;
    name: string;
    symbol: string;
    isActive: boolean;
    decimalPlaces: number;
    symbolPosition: 'before' | 'after';
  }
  
  export interface CourierFormData {
    code: string;
    name: string;
    website?: string;
    trackingUrlTemplate?: string;
    isActive: boolean;
    apiCredentials?: Record<string, any>;
    integrationSettings?: Record<string, any>;
  }
  
  // Table column types for data tables
  export interface CountryTableData extends Country {
    // Any additional computed fields for table display
  }
  
  export interface CurrencyTableData extends Currency {
    // Any additional computed fields for table display
  }
  
  export interface CourierTableData extends Courier {
    // Any additional computed fields for table display
  }