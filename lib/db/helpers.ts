// lib/db/helpers.ts
import { eq, and, isNull } from 'drizzle-orm';
import { db } from './drizzle';
import { 
  users, 
  customerProfiles, 
  warehouses, 
} from './schema';

/**
 * Find user with customer profile using direct table queries
 * This replaces db.query.users.findFirst with relational queries
 */
export async function findUserWithProfile(userId: string) {
  // Get user
  const userResult = await db
    .select({
      id: users.id,
      tenantId: users.tenantId,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      avatarUrl: users.avatarUrl,
      userType: users.userType,
      status: users.status,
      emailVerifiedAt: users.emailVerifiedAt,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1);

  if (userResult.length === 0) {
    return null;
  }

  const user = userResult[0];

  // Get customer profile
  const customerProfileResult = await db
    .select({
      id: customerProfiles.id,
      userId: customerProfiles.userId,
      customerId: customerProfiles.customerId,
      kycStatus: customerProfiles.kycStatus,
      riskLevel: customerProfiles.riskLevel,
      createdAt: customerProfiles.createdAt,
      updatedAt: customerProfiles.updatedAt,
    })
    .from(customerProfiles)
    .where(eq(customerProfiles.userId, user.id))
    .limit(1);

  const customerProfile = customerProfileResult.length > 0 ? customerProfileResult[0] : null;

  return {
    ...user,
    customerProfile,
  };
}

/**
 * Find customer profile with user details
 */
export async function findCustomerProfileWithUser(customerProfileId: string) {
  const result = await db
    .select({
      // Customer profile fields
      id: customerProfiles.id,
      userId: customerProfiles.userId,
      customerId: customerProfiles.customerId,
      kycStatus: customerProfiles.kycStatus,
      riskLevel: customerProfiles.riskLevel,
      customerCreatedAt: customerProfiles.createdAt,
      customerUpdatedAt: customerProfiles.updatedAt,
      // User fields
      userEmail: users.email,
      userFirstName: users.firstName,
      userLastName: users.lastName,
      userPhone: users.phone,
      userAvatarUrl: users.avatarUrl,
      userCreatedAt: users.createdAt,
    })
    .from(customerProfiles)
    .innerJoin(users, eq(customerProfiles.userId, users.id))
    .where(eq(customerProfiles.id, customerProfileId))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const row = result[0];
  
  return {
    id: row.id,
    userId: row.userId,
    customerId: row.customerId,
    kycStatus: row.kycStatus,
    riskLevel: row.riskLevel,
    createdAt: row.customerCreatedAt,
    updatedAt: row.customerUpdatedAt,
    user: {
      id: row.userId,
      email: row.userEmail,
      firstName: row.userFirstName,
      lastName: row.userLastName,
      phone: row.userPhone,
      avatarUrl: row.userAvatarUrl,
      createdAt: row.userCreatedAt,
    },
  };
}

/**
 * Find warehouse by ID
 */
export async function findWarehouseById(warehouseId: string) {
  const result = await db
    .select()
    .from(warehouses)
    .where(eq(warehouses.id, warehouseId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Find customer profile by ID
 */
export async function findCustomerProfileById(customerProfileId: string) {
  const result = await db
    .select()
    .from(customerProfiles)
    .where(eq(customerProfiles.id, customerProfileId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}