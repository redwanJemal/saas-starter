// lib/db/queries.ts
import { desc, and, eq, isNull } from 'drizzle-orm';
import { db } from './drizzle';
import { 
  activityLogs, 
  users, 
  customerProfiles, 
  warehouses, 
  customerWarehouseAssignments, 
  packages, 
  shipments, 
  addresses, 
  DEFAULT_TENANT_SLUG, 
  tenants, 
  packageDocuments,
  financialInvoices
} from './schema';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';

// Get current user with customer profile
export async function getUser() {
  const sessionCookie = (await cookies()).get('session');
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== 'string'
  ) {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  const user = await db
    .select()
    .from(users)
    .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
    .limit(1);

  if (user.length === 0) {
    return null;
  }

  return user[0];
}

// Get user with customer profile
export async function getUserWithProfile() {
  const user = await getUser();
  if (!user) {
    return null;
  }

  const result = await (db as any).query.users.findFirst({
    where: eq(users.id, user.id),
    with: {
      customerProfile: {
        with: {
          addresses: true,
          warehouseAssignments: {
            with: {
              warehouse: true
            }
          }
        }
      }
    }
  });

  return result || null;
}

// Get customer profile by user ID
export async function getCustomerProfile(userId: string) {
  const result = await (db as any).query.customerProfiles.findFirst({
    where: eq(customerProfiles.userId, userId),
    with: {
      user: {
        columns: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatarUrl: true
        }
      },
      addresses: true,
      warehouseAssignments: {
        with: {
          warehouse: true
        }
      }
    }
  });

  return result || null;
}

// Get packages for customer
export async function getCustomerPackages(customerProfileId: string, limit = 10) {
  return await (db as any).query.packages.findMany({
    where: eq(packages.customerProfileId, customerProfileId),
    with: {
      warehouse: {
        columns: {
          name: true,
          code: true,
          countryCode: true
        }
      },
      documents: {
        columns: {
          id: true,
          documentType: true
        }
      }
    },
    orderBy: desc(packages.createdAt),
    limit
  });
}

// Get shipments for customer
export async function getCustomerShipments(customerProfileId: string, limit = 10) {
  return await (db as any).query.shipments.findMany({
    where: eq(shipments.customerProfileId, customerProfileId),
    with: {
      warehouse: {
        columns: {
          name: true,
          code: true,
          countryCode: true
        }
      },
      shippingAddress: true,
      packages: {
        with: {
          package: {
            columns: {
              id: true,
              internalId: true,
              description: true
            }
          }
        }
      }
    },
    orderBy: desc(shipments.createdAt),
    limit
  });
}

// Get virtual addresses for customer
export async function getCustomerVirtualAddresses(customerProfileId: string) {
  return await (db as any).query.customerWarehouseAssignments.findMany({
    where: and(
      eq(customerWarehouseAssignments.customerProfileId, customerProfileId),
      eq(customerWarehouseAssignments.status, 'active')
    ),
    with: {
      warehouse: true
    }
  });
}

// Get activity logs for customer
export async function getActivityLogs() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const customerProfile = await getCustomerProfile(user.id);
  if (!customerProfile) {
    return [];
  }

  return await (db as any)
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      description: activityLogs.description,
      createdAt: activityLogs.createdAt,
      ipAddress: activityLogs.ipAddress,
      resourceType: activityLogs.resourceType
    })
    .from(activityLogs)
    .where(
      and(
        eq(activityLogs.customerProfileId, customerProfile.id),
      )
    )
    .orderBy(desc(activityLogs.createdAt))
    .limit(20);
}

// Get default tenant
export async function getDefaultTenant() {
  const result = await (db as any).query.tenants.findFirst({
    where: eq(tenants.slug, DEFAULT_TENANT_SLUG)
  });
  return result || null;
}

// Get customer dashboard stats
export async function getCustomerDashboardStats(customerProfileId: string) {
  const [packagesResult, shipmentsResult, addressesResult] = await Promise.all([
    (db as any).query.packages.findMany({
      where: eq(packages.customerProfileId, customerProfileId),
      columns: { status: true }
    }),
    (db as any).query.shipments.findMany({
      where: eq(shipments.customerProfileId, customerProfileId),
      columns: { status: true }
    }),
    (db as any).query.addresses.findMany({
      where: eq(addresses.customerProfileId, customerProfileId),
      columns: { id: true }
    })
  ]);

  const packageStats = packagesResult.reduce((acc: any, pkg: any) => {
    acc[pkg.status || ''] = (acc[pkg.status || ''] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const shipmentStats = shipmentsResult.reduce((acc: any, shipment: any) => {
    acc[shipment.status || ''] = (acc[shipment.status || ''] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalPackages: packagesResult.length,
    packagesReady: packageStats.ready_to_ship || 0,
    packagesInTransit: packageStats.shipped || 0,
    totalShipments: shipmentsResult.length,
    shipmentsDelivered: shipmentStats.delivered || 0,
    shipmentsInTransit: shipmentStats.in_transit || 0,
    totalAddresses: addressesResult.length
  };
}

// For backwards compatibility with Stripe integration
export async function getTeamForUser() {
  // Since we're using customer profiles instead of teams,
  // we'll return the customer profile as a "team" equivalent
  const userWithProfile = await getUserWithProfile();
  if (!userWithProfile?.customerProfile) {
    return null;
  }

  // Return customer profile data in a team-like structure for Stripe compatibility
  return {
    id: userWithProfile.customerProfile.id,
    name: `${userWithProfile.firstName || ''} ${userWithProfile.lastName || ''}`.trim() || 'Customer',
    customerId: userWithProfile.customerProfile.customerId,
    stripeCustomerId: null, // Will be set when customer makes first payment
    stripeSubscriptionId: null,
    stripeProductId: null,
    planName: null,
    subscriptionStatus: 'inactive'
  };
}

export async function getCustomerByStripeCustomerId(stripeCustomerId: string) {
  const result = await (db as any).query.customerProfiles.findFirst({
    where: eq(customerProfiles.stripeCustomerId, stripeCustomerId),
    with: {
      user: true
    }
  });
  
  return result || null;
}

export async function updateCustomerSubscription(
  customerProfileId: string, 
  subscriptionData: {
    stripeSubscriptionId?: string | null;
    stripeProductId?: string | null;
    planName?: string | null;
    subscriptionStatus?: string;
  }
) {
  await (db as any)
    .update(customerProfiles)
    .set({
      ...subscriptionData,
      updatedAt: new Date()
    })
    .where(eq(customerProfiles.id, customerProfileId));
}

// Compatibility functions that map to customer operations
export async function getTeamByStripeCustomerId(stripeCustomerId: string) {
  return getCustomerByStripeCustomerId(stripeCustomerId);
}

export async function updateTeamSubscription(customerId: string, subscriptionData: any) {
  return updateCustomerSubscription(customerId, subscriptionData);
}