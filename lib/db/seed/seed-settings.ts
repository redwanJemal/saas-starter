// lib/db/seed/seed-settings.ts
import { db } from '../index';
import { 
  countries, 
  currencies, 
  couriers, 
  courierServices,
  tenantCurrencies,
  tenantCouriers,
  systemSettings,
  tenantSettings,
  featureFlags
} from '@/features/settings/db/schema';
import { logSeedProgress, logSeedSuccess, logSeedError } from './utils';
import { 
  CreateCountryData, 
  CreateCurrencyData, 
  CreateCourierData,
  CreateTenantCurrencyData,
  CreateTenantCourierData,
  CreateSystemSettingData,
  CreateTenantSettingData,
  CreateFeatureFlagData
} from '@/features/settings/db/schema';

// Define missing interfaces and extend existing ones to fix type errors
interface CreateCourierServiceData {
  courierId: string;
  code: string;
  name: string;
  description?: string;
  isExpress?: boolean;
  isInternational?: boolean;
  estimatedDeliveryDays?: number;
  isActive?: boolean;
}

// Extended interfaces with tenantId for tenant-specific data
interface ExtendedTenantCurrencyData extends CreateTenantCurrencyData {
  tenantId: string;
}

interface ExtendedTenantCourierData extends CreateTenantCourierData {
  tenantId: string;
}

interface ExtendedTenantSettingData extends CreateTenantSettingData {
  tenantId: string;
}

/**
 * Seed global reference data (countries, currencies, couriers)
 */
export async function seedReferenceData() {
  logSeedProgress('Seeding countries...');
  
  const countryData: CreateCountryData[] = [
    {
      code: 'US',
      name: 'United States',
      region: 'North America',
      subregion: 'Northern America',
      isActive: true,
      isShippingEnabled: true,
      requiresPostalCode: true,
      requiresStateProvince: true,
      euMember: false,
      customsFormType: 'CN22',
      flagEmoji: '🇺🇸',
      phonePrefix: '+1'
    },
    {
      code: 'GB',
      name: 'United Kingdom',
      region: 'Europe',
      subregion: 'Northern Europe',
      isActive: true,
      isShippingEnabled: true,
      requiresPostalCode: true,
      requiresStateProvince: false,
      euMember: false,
      customsFormType: 'CN22',
      flagEmoji: '🇬🇧',
      phonePrefix: '+44'
    },
    {
      code: 'CA',
      name: 'Canada',
      region: 'North America',
      subregion: 'Northern America',
      isActive: true,
      isShippingEnabled: true,
      requiresPostalCode: true,
      requiresStateProvince: true,
      euMember: false,
      customsFormType: 'CN22',
      flagEmoji: '🇨🇦',
      phonePrefix: '+1'
    },
    {
      code: 'AU',
      name: 'Australia',
      region: 'Oceania',
      subregion: 'Australia and New Zealand',
      isActive: true,
      isShippingEnabled: true,
      requiresPostalCode: true,
      requiresStateProvince: true,
      euMember: false,
      customsFormType: 'CN22',
      flagEmoji: '🇦🇺',
      phonePrefix: '+61'
    },
    {
      code: 'DE',
      name: 'Germany',
      region: 'Europe',
      subregion: 'Western Europe',
      isActive: true,
      isShippingEnabled: true,
      requiresPostalCode: true,
      requiresStateProvince: false,
      euMember: true,
      customsFormType: 'CN23',
      flagEmoji: '🇩🇪',
      phonePrefix: '+49'
    },
    {
      code: 'FR',
      name: 'France',
      region: 'Europe',
      subregion: 'Western Europe',
      isActive: true,
      isShippingEnabled: true,
      requiresPostalCode: true,
      requiresStateProvince: false,
      euMember: true,
      customsFormType: 'CN23',
      flagEmoji: '🇫🇷',
      phonePrefix: '+33'
    },
    {
      code: 'JP',
      name: 'Japan',
      region: 'Asia',
      subregion: 'Eastern Asia',
      isActive: true,
      isShippingEnabled: true,
      requiresPostalCode: true,
      requiresStateProvince: true,
      euMember: false,
      customsFormType: 'CN22',
      flagEmoji: '🇯🇵',
      phonePrefix: '+81'
    },
    {
      code: 'SG',
      name: 'Singapore',
      region: 'Asia',
      subregion: 'South-Eastern Asia',
      isActive: true,
      isShippingEnabled: true,
      requiresPostalCode: true,
      requiresStateProvince: false,
      euMember: false,
      customsFormType: 'CN22',
      flagEmoji: '🇸🇬',
      phonePrefix: '+65'
    }
  ];
  
  const insertedCountries = await db.insert(countries).values(countryData).returning();
  logSeedSuccess(`Created ${insertedCountries.length} countries`);
  
  logSeedProgress('Seeding currencies...');
  
  const currencyData: CreateCurrencyData[] = [
    {
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      isActive: true,
      decimalPlaces: 2,
      symbolPosition: 'before'
    },
    {
      code: 'GBP',
      name: 'British Pound',
      symbol: '£',
      isActive: true,
      decimalPlaces: 2,
      symbolPosition: 'before'
    },
    {
      code: 'EUR',
      name: 'Euro',
      symbol: '€',
      isActive: true,
      decimalPlaces: 2,
      symbolPosition: 'before'
    },
    {
      code: 'CAD',
      name: 'Canadian Dollar',
      symbol: 'C$',
      isActive: true,
      decimalPlaces: 2,
      symbolPosition: 'before'
    },
    {
      code: 'AUD',
      name: 'Australian Dollar',
      symbol: 'A$',
      isActive: true,
      decimalPlaces: 2,
      symbolPosition: 'before'
    },
    {
      code: 'JPY',
      name: 'Japanese Yen',
      symbol: '¥',
      isActive: true,
      decimalPlaces: 0,
      symbolPosition: 'before'
    },
    {
      code: 'SGD',
      name: 'Singapore Dollar',
      symbol: 'S$',
      isActive: true,
      decimalPlaces: 2,
      symbolPosition: 'before'
    }
  ];
  
  const insertedCurrencies = await db.insert(currencies).values(currencyData).returning();
  logSeedSuccess(`Created ${insertedCurrencies.length} currencies`);
  
  logSeedProgress('Seeding couriers...');
  
  const courierData: CreateCourierData[] = [
    {
      code: 'USPS',
      name: 'United States Postal Service',
      website: 'https://www.usps.com',
      trackingUrlTemplate: 'https://tools.usps.com/go/TrackConfirmAction?tLabels={tracking_number}',
      isActive: true,
      integrationSettings: {
        apiVersion: 'v1',
        endpoints: {
          tracking: '/api/tracking',
          shipping: '/api/shipping'
        }
      }
    },
    {
      code: 'UPS',
      name: 'United Parcel Service',
      website: 'https://www.ups.com',
      trackingUrlTemplate: 'https://www.ups.com/track?tracknum={tracking_number}',
      isActive: true,
      integrationSettings: {
        apiVersion: 'v1',
        endpoints: {
          tracking: '/api/track',
          shipping: '/api/ship'
        }
      }
    },
    {
      code: 'FEDEX',
      name: 'FedEx',
      website: 'https://www.fedex.com',
      trackingUrlTemplate: 'https://www.fedex.com/apps/fedextrack/?tracknumbers={tracking_number}',
      isActive: true,
      integrationSettings: {
        apiVersion: 'v1',
        endpoints: {
          tracking: '/api/track',
          shipping: '/api/ship'
        }
      }
    },
    {
      code: 'DHL',
      name: 'DHL Express',
      website: 'https://www.dhl.com',
      trackingUrlTemplate: 'https://www.dhl.com/en/express/tracking.html?AWB={tracking_number}',
      isActive: true,
      integrationSettings: {
        apiVersion: 'v1',
        endpoints: {
          tracking: '/api/tracking',
          shipping: '/api/shipping'
        }
      }
    },
    {
      code: 'ROYAL_MAIL',
      name: 'Royal Mail',
      website: 'https://www.royalmail.com',
      trackingUrlTemplate: 'https://www.royalmail.com/track-your-item#/tracking-results/{tracking_number}',
      isActive: true,
      integrationSettings: {
        apiVersion: 'v1',
        endpoints: {
          tracking: '/api/tracking',
          shipping: '/api/shipping'
        }
      }
    }
  ];
  
  const insertedCouriers = await db.insert(couriers).values(courierData).returning();
  logSeedSuccess(`Created ${insertedCouriers.length} couriers`);
  
  logSeedProgress('Seeding courier services...');
  
  const courierServiceData: CreateCourierServiceData[] = [];
  
  // USPS Services
  const usps = insertedCouriers.find(c => c.code === 'USPS');
  if (usps) {
    courierServiceData.push(
      {
        courierId: usps.id,
        code: 'USPS_PRIORITY',
        name: 'USPS Priority Mail',
        description: '1-3 business day delivery within the US',
        isExpress: false,
        isInternational: false,
        estimatedDeliveryDays: 3,
        isActive: true
      },
      {
        courierId: usps.id,
        code: 'USPS_EXPRESS',
        name: 'USPS Priority Mail Express',
        description: 'Overnight to 2-day delivery within the US',
        isExpress: true,
        isInternational: false,
        estimatedDeliveryDays: 1,
        isActive: true
      },
      {
        courierId: usps.id,
        code: 'USPS_INTL',
        name: 'USPS International',
        description: 'International shipping via USPS',
        isExpress: false,
        isInternational: true,
        estimatedDeliveryDays: 10,
        isActive: true
      }
    );
  }
  
  // UPS Services
  const ups = insertedCouriers.find(c => c.code === 'UPS');
  if (ups) {
    courierServiceData.push(
      {
        courierId: ups.id,
        code: 'UPS_GROUND',
        name: 'UPS Ground',
        description: 'Standard ground shipping within the US',
        isExpress: false,
        isInternational: false,
        estimatedDeliveryDays: 5,
        isActive: true
      },
      {
        courierId: ups.id,
        code: 'UPS_2DAY',
        name: 'UPS 2nd Day Air',
        description: '2-day delivery within the US',
        isExpress: true,
        isInternational: false,
        estimatedDeliveryDays: 2,
        isActive: true
      },
      {
        courierId: ups.id,
        code: 'UPS_WORLDWIDE',
        name: 'UPS Worldwide Expedited',
        description: 'International shipping via UPS',
        isExpress: false,
        isInternational: true,
        estimatedDeliveryDays: 7,
        isActive: true
      }
    );
  }
  
  // FedEx Services
  const fedex = insertedCouriers.find(c => c.code === 'FEDEX');
  if (fedex) {
    courierServiceData.push(
      {
        courierId: fedex.id,
        code: 'FEDEX_GROUND',
        name: 'FedEx Ground',
        description: 'Standard ground shipping within the US',
        isExpress: false,
        isInternational: false,
        estimatedDeliveryDays: 5,
        isActive: true
      },
      {
        courierId: fedex.id,
        code: 'FEDEX_2DAY',
        name: 'FedEx 2Day',
        description: '2-day delivery within the US',
        isExpress: true,
        isInternational: false,
        estimatedDeliveryDays: 2,
        isActive: true
      },
      {
        courierId: fedex.id,
        code: 'FEDEX_INTL',
        name: 'FedEx International Priority',
        description: 'International shipping via FedEx',
        isExpress: true,
        isInternational: true,
        estimatedDeliveryDays: 3,
        isActive: true
      }
    );
  }
  
  const insertedCourierServices = await db.insert(courierServices).values(courierServiceData).returning();
  logSeedSuccess(`Created ${insertedCourierServices.length} courier services`);
  
  return {
    countries: insertedCountries,
    currencies: insertedCurrencies,
    couriers: insertedCouriers,
    courierServices: insertedCourierServices
  };
}

/**
 * Seed tenant-specific settings
 * @param tenantIds Array of tenant IDs to create settings for
 * @param referenceData Reference data (currencies, couriers) to link to tenants
 */
export async function seedTenantSettings(
  tenantIds: string[], 
  referenceData: { 
    currencies: any[], 
    couriers: any[] 
  }
) {
  if (!tenantIds.length) {
    logSeedError('No tenant IDs provided for seeding tenant settings');
    return { tenantCurrencies: [], tenantCouriers: [], tenantSettings: [] };
  }

  logSeedProgress('Seeding tenant currencies...');
  
  const tenantCurrencyData: ExtendedTenantCurrencyData[] = [];
  const tenantCourierData: ExtendedTenantCourierData[] = [];
  const tenantSettingData: ExtendedTenantSettingData[] = [];
  
  // Assign currencies to tenants
  for (const tenantId of tenantIds) {
    // Assign USD as default currency for all tenants
    const usd = referenceData.currencies.find(c => c.code === 'USD');
    if (usd) {
      tenantCurrencyData.push({
        tenantId,
        currencyId: usd.id,
        isDefault: true,
        exchangeRate: '1.00'
      });
    }
    
    // Assign other currencies
    for (const currency of referenceData.currencies) {
      if (currency.code !== 'USD') {
        const exchangeRate = currency.code === 'GBP' ? '0.78' : 
                            currency.code === 'EUR' ? '0.92' : 
                            currency.code === 'CAD' ? '1.35' : 
                            currency.code === 'AUD' ? '1.50' : 
                            currency.code === 'JPY' ? '150.00' : 
                            currency.code === 'SGD' ? '1.34' : '1.00';
        
        tenantCurrencyData.push({
          tenantId,
          currencyId: currency.id,
          isDefault: false,
          exchangeRate
        });
      }
    }
    
    // Assign couriers to tenants
    for (const courier of referenceData.couriers) {
      tenantCourierData.push({
        tenantId,
        courierId: courier.id,
        isActive: true,
        contractDetails: {
          accountNumber: `ACCT-${tenantId.substring(0, 6)}-${courier.code}`,
          discountRate: Math.floor(Math.random() * 20) + 5,
          effectiveDate: new Date().toISOString().split('T')[0]
        }
      });
    }
    
    // Create tenant settings
    tenantSettingData.push(
      {
        tenantId,
        key: 'default_warehouse_id',
        value: '',  // Will be updated after warehouses are created
        description: 'Default warehouse ID for new packages',
        category: 'warehouses',
        overridesSystemDefault: true
      },
      {
        tenantId,
        key: 'default_storage_days',
        value: '30',
        description: 'Default free storage days',
        category: 'storage',
        overridesSystemDefault: true
      },
      {
        tenantId,
        key: 'enable_consolidation',
        value: 'true',
        description: 'Enable package consolidation feature',
        category: 'features',
        overridesSystemDefault: false
      },
      {
        tenantId,
        key: 'enable_personal_shopper',
        value: 'true',
        description: 'Enable personal shopper feature',
        category: 'features',
        overridesSystemDefault: false
      },
      {
        tenantId,
        key: 'notification_email_from',
        value: `noreply@tenant-${tenantId.substring(0, 8)}.com`,
        description: 'From email address for notifications',
        category: 'notifications',
        overridesSystemDefault: true
      }
    );
  }
  
  const insertedTenantCurrencies = await db.insert(tenantCurrencies).values(tenantCurrencyData).returning();
  logSeedSuccess(`Created ${insertedTenantCurrencies.length} tenant currencies`);
  
  const insertedTenantCouriers = await db.insert(tenantCouriers).values(tenantCourierData).returning();
  logSeedSuccess(`Created ${insertedTenantCouriers.length} tenant couriers`);
  
  const insertedTenantSettings = await db.insert(tenantSettings).values(tenantSettingData).returning();
  logSeedSuccess(`Created ${insertedTenantSettings.length} tenant settings`);
  
  return {
    tenantCurrencies: insertedTenantCurrencies,
    tenantCouriers: insertedTenantCouriers,
    tenantSettings: insertedTenantSettings
  };
}

/**
 * Seed system settings and feature flags
 */
export async function seedSystemSettings() {
  logSeedProgress('Seeding system settings...');
  
  const systemSettingData: CreateSystemSettingData[] = [
    {
      key: 'system_name',
      value: 'Package Forward Pro',
      description: 'System name displayed in UI',
      category: 'general',
      isPublic: true
    },
    {
      key: 'support_email',
      value: 'support@packageforwardpro.com',
      description: 'Support email address',
      category: 'contact',
      isPublic: true
    },
    {
      key: 'default_currency',
      value: 'USD',
      description: 'Default system currency',
      category: 'finance',
      isPublic: true
    },
    {
      key: 'default_storage_days',
      value: '30',
      description: 'Default free storage days',
      category: 'storage',
      isPublic: true
    },
    {
      key: 'smtp_host',
      value: 'smtp.example.com',
      description: 'SMTP server host',
      category: 'email',
      isPublic: false
    },
    {
      key: 'smtp_port',
      value: '587',
      description: 'SMTP server port',
      category: 'email',
      isPublic: false
    },
    {
      key: 'smtp_user',
      value: 'smtp_user',
      description: 'SMTP username',
      category: 'email',
      isPublic: false,
      isEncrypted: true
    },
    {
      key: 'smtp_password',
      value: 'smtp_password',
      description: 'SMTP password',
      category: 'email',
      isPublic: false,
      isEncrypted: true
    },
    {
      key: 'notification_email_from',
      value: 'noreply@packageforwardpro.com',
      description: 'From email address for notifications',
      category: 'notifications',
      isPublic: false
    },
    {
      key: 'max_package_weight_kg',
      value: '50',
      description: 'Maximum package weight in kg',
      category: 'packages',
      isPublic: true
    }
  ];
  
  const insertedSystemSettings = await db.insert(systemSettings).values(systemSettingData).returning();
  logSeedSuccess(`Created ${insertedSystemSettings.length} system settings`);
  
  logSeedProgress('Seeding feature flags...');
  
  const featureFlagData: CreateFeatureFlagData[] = [
    {
      name: 'enable_consolidation',
      description: 'Enable package consolidation feature',
      isEnabled: true,
      rolloutPercentage: 100
    },
    {
      name: 'enable_personal_shopper',
      description: 'Enable personal shopper feature',
      isEnabled: true,
      rolloutPercentage: 100
    },
    {
      name: 'enable_insurance',
      description: 'Enable package insurance feature',
      isEnabled: true,
      rolloutPercentage: 100
    },
    {
      name: 'enable_customs_declaration',
      description: 'Enable customs declaration feature',
      isEnabled: true,
      rolloutPercentage: 100
    },
    {
      name: 'enable_storage_extension',
      description: 'Enable storage extension feature',
      isEnabled: true,
      rolloutPercentage: 100
    },
    {
      name: 'enable_new_dashboard',
      description: 'Enable new dashboard UI',
      isEnabled: false,
      rolloutPercentage: 0
    }
  ];
  
  const insertedFeatureFlags = await db.insert(featureFlags).values(featureFlagData).returning();
  logSeedSuccess(`Created ${insertedFeatureFlags.length} feature flags`);
  
  return {
    systemSettings: insertedSystemSettings,
    featureFlags: insertedFeatureFlags
  };
}