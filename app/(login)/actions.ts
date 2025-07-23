// app/(login)/actions.ts
'use server';

import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { 
  users, 
  customerProfiles, 
  customerWarehouseAssignments,
  warehouses,
  activityLogs,
  tenants,
  userRoles,
  roles,
  type NewUser, 
  type NewCustomerProfile,
  type NewActivityLog,
  DEFAULT_TENANT_SLUG,
  CUSTOMER_ID_PREFIX,
  CUSTOMER_ID_LENGTH
} from '@/lib/db/schema';
import { comparePasswords, hashPassword, setSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getUser, getUserWithProfile, getDefaultTenant } from '@/lib/db/queries';
import { validatedAction, validatedActionWithUser } from '@/lib/auth/middleware';

// Generate unique customer ID
function generateCustomerId(): string {
  const randomNum = Math.floor(Math.random() * Math.pow(10, CUSTOMER_ID_LENGTH))
    .toString()
    .padStart(CUSTOMER_ID_LENGTH, '0');
  return `${CUSTOMER_ID_PREFIX}-${randomNum}`;
}

// Log customer activity
async function logActivity(
  tenantId: string,
  userId: string,
  customerProfileId: string | null,
  action: string,
  description?: string,
  resourceType?: string,
  resourceId?: string,
  ipAddress?: string
) {
  const newActivity: NewActivityLog = {
    tenantId,
    userId,
    customerProfileId,
    action,
    description,
    resourceType: resourceType || 'user',
    resourceId,
    ipAddress: ipAddress || null // Use null instead of empty string for IP address
  };

  await db.insert(activityLogs).values(newActivity);
}

const signInSchema = z.object({
  email: z.string().email().min(3).max(255),
  password: z.string().min(8).max(100)
});

export const signIn = validatedAction(signInSchema, async (data, formData) => {
  const { email, password } = data;

  // Get default tenant
  const tenant = await getDefaultTenant();
  if (!tenant) {
    return { error: 'System configuration error. Please try again.', email, password };
  }

  // Find user with customer profile
  const userWithProfile = await db.query.users.findFirst({
    where: and(
      eq(users.email, email),
      eq(users.tenantId, tenant.id)
    ),
    with: {
      customerProfile: true
    }
  });

  if (!userWithProfile) {
    return { error: 'Invalid email or password. Please try again.', email, password };
  }

  const isPasswordValid = await comparePasswords(password, userWithProfile.passwordHash);
  if (!isPasswordValid) {
    return { error: 'Invalid email or password. Please try again.', email, password };
  }

  await Promise.all([
    setSession({
      id: userWithProfile.id,
      email: userWithProfile.email,
      firstName: userWithProfile.firstName,
      lastName: userWithProfile.lastName
    }),
    logActivity(
      tenant.id,
      userWithProfile.id,
      userWithProfile.customerProfile?.id || null,
      'SIGN_IN',
      'User signed in',
      'authentication'
    )
  ]);

  redirect('/dashboard');
});

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(50).optional()
});

export const signUp = validatedAction(signUpSchema, async (data, formData) => {
  const { email, password, firstName, lastName, phone } = data;

  // Get default tenant
  const tenant = await getDefaultTenant();
  if (!tenant) {
    return { error: 'System configuration error. Please try again.', email, password };
  }

  // Check if user already exists
  const existingUser = await db.query.users.findFirst({
    where: and(
      eq(users.email, email),
      eq(users.tenantId, tenant.id)
    )
  });

  if (existingUser) {
    return { error: 'An account with this email already exists.', email, password };
  }

  const passwordHash = await hashPassword(password);

  // Create user
  const newUser: NewUser = {
    tenantId: tenant.id,
    email,
    passwordHash,
    firstName,
    lastName,
    phone,
    userType: 'customer',
    status: 'active',
    emailVerifiedAt: new Date() // Auto-verify for now
  };

  const [createdUser] = await db.insert(users).values(newUser).returning();
  if (!createdUser) {
    return { error: 'Failed to create account. Please try again.', email, password };
  }

  // Generate unique customer ID
  let customerId = generateCustomerId();
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const existing = await db.query.customerProfiles.findFirst({
      where: eq(customerProfiles.customerId, customerId)
    });

    if (!existing) break;
    
    customerId = generateCustomerId();
    attempts++;
  }

  if (attempts >= maxAttempts) {
    return { error: 'Failed to generate unique customer ID. Please try again.', email, password };
  }

  // Create customer profile
  const newCustomerProfile: NewCustomerProfile = {
    userId: createdUser.id,
    tenantId: tenant.id,
    customerId,
    kycStatus: 'not_required',
    riskLevel: 'low'
  };

  const [createdProfile] = await db.insert(customerProfiles).values(newCustomerProfile).returning();
  if (!createdProfile) {
    return { error: 'Failed to create customer profile. Please try again.', email, password };
  }

  // Assign customer role
  const customerRole = await db.query.roles.findFirst({
    where: and(
      eq(roles.tenantId, tenant.id),
      eq(roles.slug, 'customer')
    )
  });

  if (customerRole) {
    await db.insert(userRoles).values({
      userId: createdUser.id,
      roleId: customerRole.id
    });
  }

  // Assign to default warehouse (UK1)
  const defaultWarehouse = await db.query.warehouses.findFirst({
    where: and(
      eq(warehouses.tenantId, tenant.id),
      eq(warehouses.code, 'UK1')
    )
  });

  if (defaultWarehouse) {
    await db.insert(customerWarehouseAssignments).values({
      customerProfileId: createdProfile.id,
      warehouseId: defaultWarehouse.id,
      suiteCode: customerId,
      status: 'active',
      assignedBy: createdUser.id
    });
  }

  await Promise.all([
    setSession({
      id: createdUser.id,
      email: createdUser.email,
      firstName: createdUser.firstName,
      lastName: createdUser.lastName
    }),
    logActivity(
      tenant.id,
      createdUser.id,
      createdProfile.id,
      'SIGN_UP',
      'Customer account created',
      'customer_profile',
      createdProfile.id
    )
  ]);

  redirect('/dashboard');
});

export async function signOut() {
  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
    return;
  }

  const userWithProfile = await getUserWithProfile();
  const tenant = await getDefaultTenant();

  if (tenant && userWithProfile?.customerProfile) {
    await logActivity(
      tenant.id,
      user.id,
      userWithProfile.customerProfile.id,
      'SIGN_OUT',
      'User signed out',
      'authentication'
    );
  }

  (await cookies()).delete('session');
  redirect('/sign-in');
}

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(100),
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100)
});

export const updatePassword = validatedActionWithUser(
  updatePasswordSchema,
  async (data, _, user) => {
    const { currentPassword, newPassword, confirmPassword } = data;

    const isPasswordValid = await comparePasswords(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      return { 
        currentPassword, 
        newPassword, 
        confirmPassword, 
        error: 'Current password is incorrect.' 
      };
    }

    if (currentPassword === newPassword) {
      return { 
        currentPassword, 
        newPassword, 
        confirmPassword, 
        error: 'New password must be different from the current password.' 
      };
    }

    if (confirmPassword !== newPassword) {
      return { 
        currentPassword, 
        newPassword, 
        confirmPassword, 
        error: 'New password and confirmation password do not match.' 
      };
    }

    const newPasswordHash = await hashPassword(newPassword);
    const userWithProfile = await getUserWithProfile();
    const tenant = await getDefaultTenant();

    await Promise.all([
      db.update(users)
        .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
        .where(eq(users.id, user.id)),
      tenant && userWithProfile?.customerProfile && logActivity(
        tenant.id,
        user.id,
        userWithProfile.customerProfile.id,
        'PASSWORD_CHANGED',
        'Password updated',
        'user_security'
      )
    ]);

    return { success: 'Password updated successfully.' };
  }
);

const updateAccountSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(50).optional()
});

export const updateAccount = validatedActionWithUser(
  updateAccountSchema,
  async (data, _, user) => {
    const { firstName, lastName, email, phone } = data;

    // Check if email is already taken by another user
    if (email !== user.email) {
      const existingUser = await db.query.users.findFirst({
        where: and(
          eq(users.email, email),
          eq(users.tenantId, user.tenantId)
        )
      });

      if (existingUser && existingUser.id !== user.id) {
        return { error: 'Email address is already in use.' };
      }
    }

    const userWithProfile = await getUserWithProfile();
    const tenant = await getDefaultTenant();

    await Promise.all([
      db.update(users)
        .set({ firstName, lastName, email, phone, updatedAt: new Date() })
        .where(eq(users.id, user.id)),
      tenant && userWithProfile?.customerProfile && logActivity(
        tenant.id,
        user.id,
        userWithProfile.customerProfile.id,
        'PROFILE_UPDATED',
        'Profile information updated',
        'customer_profile',
        userWithProfile.customerProfile.id
      )
    ]);

    return { firstName, lastName, email, phone, success: 'Account updated successfully.' };
  }
);

const deleteAccountSchema = z.object({
  password: z.string().min(8).max(100)
});

export const deleteAccount = validatedActionWithUser(
  deleteAccountSchema,
  async (data, _, user) => {
    const { password } = data;

    const isPasswordValid = await comparePasswords(password, user.passwordHash);
    if (!isPasswordValid) {
      return { password, error: 'Incorrect password. Account deletion failed.' };
    }

    const userWithProfile = await getUserWithProfile();
    const tenant = await getDefaultTenant();

    if (tenant && userWithProfile?.customerProfile) {
      await logActivity(
        tenant.id,
        user.id,
        userWithProfile.customerProfile.id,
        'ACCOUNT_DELETED',
        'Customer account deleted',
        'customer_profile',
        userWithProfile.customerProfile.id
      );
    }

    // Soft delete user
    await db.update(users)
      .set({ 
        deletedAt: new Date(),
        email: `${user.email}-${user.id}-deleted`, // Ensure email uniqueness
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));

    (await cookies()).delete('session');
    redirect('/sign-in');
  }
);