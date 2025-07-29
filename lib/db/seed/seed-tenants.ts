// lib/db/seed/seed-tenants.ts
import { db } from '../index';
import { tenants } from '@/features/auth/db/schema';
import { logSeedProgress, logSeedSuccess } from './utils';

export async function seedTenants() {
  logSeedProgress('Seeding tenants...');

  const tenantData = [
    {
      name: 'Package Forward Pro',
      slug: 'package-forward-pro',
      domain: 'packageforwardpro.com',
      companyName: 'Package Forward Pro Inc.',
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
    },
    {
      name: 'Global Ship Express',
      slug: 'global-ship-express',
      domain: 'globalshipexpress.com',
      companyName: 'Global Ship Express LLC',
      companyRegistration: 'REG-002-2024',
      taxNumber: 'TAX-GSE-002',
      planType: 'professional',
      billingEmail: 'billing@globalshipexpress.com',
      status: 'active' as const,
      maxUsers: 500,
      maxPackagesMonthly: 25000,
      settings: {
        timezone: 'America/Los_Angeles',
        currency: 'USD',
        notifications: {
          email: true,
          sms: false,
          push: true
        },
        features: {
          personalShopper: false,
          consolidation: true,
          insurance: true,
          storage: false
        }
      },
      branding: {
        primaryColor: '#059669',
        logo: '/logos/global-ship-express.png',
        favicon: '/favicons/global-ship-express.ico'
      }
    },
    {
      name: 'QuickForward',
      slug: 'quickforward',
      domain: 'quickforward.net',
      companyName: 'QuickForward Services Corp',
      companyRegistration: 'REG-003-2024',
      taxNumber: 'TAX-QF-003',
      planType: 'standard',
      billingEmail: 'billing@quickforward.net',
      status: 'active' as const,
      maxUsers: 100,
      maxPackagesMonthly: 10000,
      settings: {
        timezone: 'America/Chicago',
        currency: 'USD',
        notifications: {
          email: true,
          sms: false,
          push: false
        },
        features: {
          personalShopper: false,
          consolidation: false,
          insurance: false,
          storage: true
        }
      },
      branding: {
        primaryColor: '#dc2626',
        logo: '/logos/quickforward.png',
        favicon: '/favicons/quickforward.ico'
      }
    }
  ];

  const insertedTenants = await db.insert(tenants).values(tenantData).returning();

  logSeedSuccess(`Created ${insertedTenants.length} tenants`);
  return insertedTenants;
}