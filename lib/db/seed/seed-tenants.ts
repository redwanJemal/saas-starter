// lib/db/seed/seed-tenants.ts
import { db } from '../index';
import { tenants } from '@/features/auth/db/schema';
import { logSeedProgress, logSeedSuccess } from './utils';

export async function seedTenants() {
  logSeedProgress('Seeding tenants...');

  const tenantData = [
    {
      name: 'UkToEast',
      slug: 'package-forward-pro',
      domain: 'packageforwardpro.com',
      companyName: 'UkToEast Inc.',
      companyRegistration: 'REG-001-2024',
      taxNumber: 'TAX-PFP-001',
      planType: 'enterprise',
      billingEmail: 'billing@packageforwardpro.com',
      status: 'active' as const,
      maxUsers: 1000,
      maxPackagesMonthly: 50000,
      settings: {
        timezone: 'America/New_York',
        currency: 'USD',
        notifications: {
          email: true,
          sms: true,
          push: true
        },
        features: {
          personalShopper: true,
          consolidation: true,
          insurance: true,
          storage: true
        }
      },
      branding: {
        primaryColor: '#2563eb',
        logo: '/logos/package-forward-pro.png',
        favicon: '/favicons/package-forward-pro.ico'
      }
    }
  ];

  const insertedTenants = await db.insert(tenants).values(tenantData).returning();

  logSeedSuccess(`Created ${insertedTenants.length} tenants`);
  return insertedTenants;
}