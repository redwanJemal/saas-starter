// lib/db/seed-master-data.ts
import { db } from './drizzle';
import { countries, currencies, couriers, tenantCurrencies, tenantCouriers, tenants } from './schema';
import { eq } from 'drizzle-orm';

export async function seedMasterData(tenantId?: string) {
  console.log('🌱 Seeding master data...');

  // Seed countries
  const countriesToSeed = [
    { code: 'US', name: 'United States', region: 'North America', callingCode: '+1' },
    { code: 'CA', name: 'Canada', region: 'North America', callingCode: '+1' },
    { code: 'GB', name: 'United Kingdom', region: 'Europe', callingCode: '+44' },
    { code: 'DE', name: 'Germany', region: 'Europe', callingCode: '+49' },
    { code: 'FR', name: 'France', region: 'Europe', callingCode: '+33' },
    { code: 'AU', name: 'Australia', region: 'Oceania', callingCode: '+61' },
    { code: 'JP', name: 'Japan', region: 'Asia', callingCode: '+81' },
    { code: 'CN', name: 'China', region: 'Asia', callingCode: '+86' },
    { code: 'IN', name: 'India', region: 'Asia', callingCode: '+91' },
    { code: 'BR', name: 'Brazil', region: 'South America', callingCode: '+55' },
    { code: 'AE', name: 'United Arab Emirates', region: 'Middle East', callingCode: '+971' },
    { code: 'SG', name: 'Singapore', region: 'Asia', callingCode: '+65' },
    { code: 'HK', name: 'Hong Kong', region: 'Asia', callingCode: '+852' },
    { code: 'NL', name: 'Netherlands', region: 'Europe', callingCode: '+31' },
    { code: 'ES', name: 'Spain', region: 'Europe', callingCode: '+34' },
  ];

  console.log('📍 Seeding countries...');
  for (const country of countriesToSeed) {
    await db.insert(countries).values(country).onConflictDoNothing();
  }

  // Seed currencies
  const currenciesToSeed = [
    { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2 },
    { code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2 },
    { code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2 },
    { code: 'CAD', name: 'Canadian Dollar', symbol: '$', decimalPlaces: 2 },
    { code: 'AUD', name: 'Australian Dollar', symbol: '$', decimalPlaces: 2 },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimalPlaces: 0 },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimalPlaces: 2 },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimalPlaces: 2 },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', decimalPlaces: 2 },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', decimalPlaces: 2 },
    { code: 'SGD', name: 'Singapore Dollar', symbol: '$', decimalPlaces: 2 },
    { code: 'HKD', name: 'Hong Kong Dollar', symbol: '$', decimalPlaces: 2 },
  ];

  console.log('💰 Seeding currencies...');
  for (const currency of currenciesToSeed) {
    await db.insert(currencies).values(currency).onConflictDoNothing();
  }

  // Seed major couriers
  const couriersToSeed = [
    {
      name: 'FedEx',
      code: 'FEDEX',
      websiteUrl: 'https://www.fedex.com',
      trackingUrlTemplate: 'https://www.fedex.com/fedextrack/?trknbr={tracking_number}',
      supportedCountries: ['US', 'CA', 'GB', 'DE', 'FR', 'AU', 'JP', 'CN', 'IN', 'BR', 'AE', 'SG', 'HK'],
    },
    {
      name: 'UPS',
      code: 'UPS',
      websiteUrl: 'https://www.ups.com',
      trackingUrlTemplate: 'https://www.ups.com/track?loc=en_US&tracknum={tracking_number}',
      supportedCountries: ['US', 'CA', 'GB', 'DE', 'FR', 'AU', 'JP', 'CN', 'IN', 'BR', 'AE', 'SG'],
    },
    {
      name: 'DHL Express',
      code: 'DHL',
      websiteUrl: 'https://www.dhl.com',
      trackingUrlTemplate: 'https://www.dhl.com/en/express/tracking.html?AWB={tracking_number}',
      supportedCountries: ['US', 'CA', 'GB', 'DE', 'FR', 'AU', 'JP', 'CN', 'IN', 'BR', 'AE', 'SG', 'HK'],
    },
    {
      name: 'USPS',
      code: 'USPS',
      websiteUrl: 'https://www.usps.com',
      trackingUrlTemplate: 'https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1={tracking_number}',
      supportedCountries: ['US'],
    },
    {
      name: 'Royal Mail',
      code: 'ROYAL_MAIL',
      websiteUrl: 'https://www.royalmail.com',
      trackingUrlTemplate: 'https://www.royalmail.com/track-your-item?trackNumber={tracking_number}',
      supportedCountries: ['GB'],
    },
    {
      name: 'Canada Post',
      code: 'CANADA_POST',
      websiteUrl: 'https://www.canadapost-postescanada.ca',
      trackingUrlTemplate: 'https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor={tracking_number}',
      supportedCountries: ['CA'],
    },
    {
      name: 'Amazon Logistics',
      code: 'AMAZON',
      websiteUrl: 'https://www.amazon.com',
      trackingUrlTemplate: 'https://track.amazon.com/tracking/{tracking_number}',
      supportedCountries: ['US', 'CA', 'GB', 'DE', 'FR', 'AU', 'JP', 'IN', 'BR'],
    },
    {
      name: 'TNT',
      code: 'TNT',
      websiteUrl: 'https://www.tnt.com',
      trackingUrlTemplate: 'https://www.tnt.com/express/en_us/site/shipping-tools/tracking.html?cons={tracking_number}',
      supportedCountries: ['US', 'CA', 'GB', 'DE', 'FR', 'AU', 'CN', 'AE'],
    },
    {
      name: 'Emirates Post',
      code: 'EMIRATES_POST',
      websiteUrl: 'https://www.epg.gov.ae',
      trackingUrlTemplate: 'https://www.epg.gov.ae/en/services/track-and-trace?trackingNumber={tracking_number}',
      supportedCountries: ['AE'],
    },
    {
      name: 'SingPost',
      code: 'SINGPOST',
      websiteUrl: 'https://www.singpost.com',
      trackingUrlTemplate: 'https://www.singpost.com/track-items?trackingNumber={tracking_number}',
      supportedCountries: ['SG'],
    },
  ];

  console.log('🚚 Seeding couriers...');
  for (const courier of couriersToSeed) {
    await db.insert(couriers).values(courier).onConflictDoNothing();
  }

  // If a tenant ID is provided, set up default tenant configurations
  if (tenantId) {
    console.log('🏢 Setting up tenant configurations...');
    
    // Get the seeded currencies and couriers
    const usdCurrency = await db.select().from(currencies).where(eq(currencies.code, 'USD')).limit(1);
    const majorCouriers = await db.select().from(couriers).where(eq(couriers.code, 'FEDEX')).limit(1);
    
    if (usdCurrency.length > 0) {
      // Set USD as default currency for tenant
      await db.insert(tenantCurrencies).values({
        tenantId,
        currencyId: usdCurrency[0].id,
        isDefault: true,
        exchangeRate: '1.0',
      }).onConflictDoNothing();
    }

    // Enable major couriers for tenant
    const enabledCouriers = ['FEDEX', 'UPS', 'DHL', 'USPS'];
    for (const courierCode of enabledCouriers) {
      const [courier] = await db.select().from(couriers).where(eq(couriers.code, courierCode)).limit(1);
      if (courier) {
        await db.insert(tenantCouriers).values({
          tenantId,
          courierId: courier.id,
          isActive: true,
        }).onConflictDoNothing();
      }
    }
  }

  console.log('✅ Master data seeding completed');
  console.log('📊 Seeded:');
  console.log(`   • ${countriesToSeed.length} countries`);
  console.log(`   • ${currenciesToSeed.length} currencies`);
  console.log(`   • ${couriersToSeed.length} couriers`);

  if (tenantId) {
    console.log('   • Tenant configurations setup');
  }
}

// Script runner
if (require.main === module) {
  seedMasterData()
    .then(() => {
      console.log('✅ Master data seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Master data seeding failed:', error);
      process.exit(1);
    });
}