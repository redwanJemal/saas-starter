// lib/db/seed/seed-customer-profiles.ts
import { db } from '../index';
import { customerProfiles } from '@/features/customers/db/schema';
import { logSeedProgress, logSeedSuccess, logSeedError } from './utils';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';

interface UserData {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: string;
}

/**
 * Seed customer profiles for customer users
 * @param users Array of user objects with at least id, tenantId, and userType
 * @param resetData If true, deletes existing customer profile data before seeding
 */
export async function seedCustomerProfiles(users: UserData[], resetData: boolean = false) {
  if (!users.length) {
    logSeedError('No users provided for seeding customer profiles');
    return { customerProfiles: [] };
  }

  // Filter for customer users only
  const customerUsers = users.filter(user => user.userType === 'customer');
  
  if (!customerUsers.length) {
    logSeedError('No customer users found for seeding customer profiles');
    return { customerProfiles: [] };
  }

  if (resetData) {
    logSeedProgress('Resetting customer profile data...');
    await db.delete(customerProfiles);
    logSeedSuccess('Customer profile data reset complete');
  }

  logSeedProgress('Seeding customer profiles...');

  // Create customer profiles for each customer user
  const customerProfileData = customerUsers.map(user => {
    const namePart = user.firstName.toLowerCase();
    return {
      id: uuidv4(), // Generate a new ID for the customer profile
      userId: user.id, // Reference to the user
      tenantId: user.tenantId,
      customerId: `CUST-${namePart}-${user.id.substring(0, 6)}`, // Generate a customer ID
      kycStatus: 'approved' as const,
      riskLevel: 'low' as const,
      accountStatus: 'active',
      marketingOptIn: true,
      smsOptIn: true,
      emailOptIn: true
    };
  });

  // Insert customer profiles
  const insertedProfiles = await db.insert(customerProfiles).values(customerProfileData).returning();
  
  logSeedSuccess(`Created ${insertedProfiles.length} customer profiles`);
  
  return { customerProfiles: insertedProfiles };
}
