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
    return { error: 'System configuration error. Please try again.' };
  }

  // Find user with customer profile - FIXED: Use direct select instead of query
  const userWithProfile = await db
    .select({
      id: users.id,
      email: users.email,
      passwordHash: users.passwordHash,
      firstName: users.firstName,
      lastName: users.lastName,
      tenantId: users.tenantId,
      userType: users.userType,
      status: users.status,
      customerProfileId: customerProfiles.id,
      customerId: customerProfiles.customerId,
    })
    .from(users)
    .leftJoin(customerProfiles, eq(users.id, customerProfiles.userId))
    .where(
      and(
        eq(users.email, email),
        eq(users.tenantId, tenant.id)
      )
    )
    .limit(1);

  if (userWithProfile.length === 0) {
    return { error: 'Invalid email or password.' };
  }

  const user = userWithProfile[0];

  // Verify password
  const isValidPassword = await comparePasswords(password, user.passwordHash);
  if (!isValidPassword) {
    return { error: 'Invalid email or password.' };
  }

  // Check if user is active
  if (user.status !== 'active') {
    return { error: 'Account is not active. Please contact support.' };
  }

  // Set session - only pass the required fields
  await setSession({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  });

  // Log the sign-in activity
  await logActivity(
    tenant.id,
    user.id,
    user.customerProfileId,
    'user.sign_in',
    'User signed in successfully',
    'authentication'
  );

  // Check for redirect from cookies or search params
  const cookieStore = await cookies();
  const redirectCookie = cookieStore.get('redirectAfterLogin');
  
  if (redirectCookie) {
    cookieStore.delete('redirectAfterLogin');
    redirect(redirectCookie.value);
  }

  // Check if user has customer profile
  if (!user.customerProfileId) {
    redirect('/dashboard/general'); // Redirect to complete profile
  }

  redirect('/dashboard');
});

const signUpSchema = z.object({
  email: z.string().email().min(3).max(255),
  password: z.string().min(8).max(100),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().min(10).max(20).optional()
});

export const signUp = validatedAction(signUpSchema, async (data, formData) => {
  const { email, password, firstName, lastName, phone } = data;

  // Get default tenant
  const tenant = await getDefaultTenant();
  if (!tenant) {
    return { error: 'System configuration error. Please try again.' };
  }

  // Check if user already exists
  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.email, email),
        eq(users.tenantId, tenant.id)
      )
    )
    .limit(1);

  if (existingUser.length > 0) {
    return { error: 'User with this email already exists.' };
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const newUser: NewUser = {
    tenantId: tenant.id,
    email,
    passwordHash,
    firstName,
    lastName,
    phone: phone || null,
    userType: 'customer',
    status: 'active'
  };

  const createdUsers = await db.insert(users).values(newUser).returning();
  const createdUser = createdUsers[0];

  // Create customer profile
  const newCustomerProfile: NewCustomerProfile = {
    tenantId: tenant.id,
    userId: createdUser.id,
    customerId: generateCustomerId(),
    kycStatus: 'not_required'
  };

  const createdProfiles = await db.insert(customerProfiles).values(newCustomerProfile).returning();
  const createdProfile = createdProfiles[0];

  // Log the sign-up activity
  await logActivity(
    tenant.id,
    createdUser.id,
    createdProfile.id,
    'user.sign_up',
    'User account created successfully',
    'user'
  );

  // Set session - only pass the required fields
  await setSession({
    id: createdUser.id,
    email: createdUser.email,
    firstName: createdUser.firstName,
    lastName: createdUser.lastName,
  });

  redirect('/dashboard');
});

const updateAccountSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().min(3).max(255),
  phone: z.string().min(10).max(20).optional()
});

export const updateAccount = validatedActionWithUser(updateAccountSchema, async (data, formData, user) => {
  const { firstName, lastName, email, phone } = data;

  // Check if email is being changed and if it's already taken
  if (email !== user.email) {
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.email, email),
          eq(users.tenantId, user.tenantId)
        )
      )
      .limit(1);

    if (existingUser.length > 0) {
      return { error: 'Email is already taken.' };
    }
  }

  // Update user
  await db
    .update(users)
    .set({
      firstName,
      lastName,
      email,
      phone: phone || null,
      updatedAt: new Date()
    })
    .where(eq(users.id, user.id));

  // Get user with profile for activity logging
  const userWithProfile = await getUserWithProfile();
  
  // Log the update activity
  await logActivity(
    user.tenantId,
    user.id,
    userWithProfile?.customerProfile?.id || null,
    'user.update_profile',
    'User profile updated successfully',
    'user'
  );

  return { success: 'Account updated successfully.' };
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(100),
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100)
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match",
  path: ["confirmPassword"]
});

// Schema for account deletion
const deleteAccountSchema = z.object({
  password: z.string().min(8).max(100),
  confirmation: z.string().refine((val) => val === "DELETE", {
    message: "Please type DELETE to confirm"
  })
});

export const updatePassword = validatedActionWithUser(
  updatePasswordSchema,
  async (data, formData, user) => {
    const { currentPassword, newPassword } = data;

    // Verify current password
    const isValidPassword = await comparePasswords(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return { error: 'Current password is incorrect.' };
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password in database
    await db
      .update(users)
      .set({ 
        passwordHash: hashedNewPassword,
        updatedAt: new Date() 
      })
      .where(eq(users.id, user.id));

    // Get user with profile for activity logging
    const userWithProfile = await getUserWithProfile();

    // Log the password change activity
    await logActivity(
      user.tenantId,
      user.id,
      userWithProfile?.customerProfile?.id || null,
      'PASSWORD_CHANGED',
      'User password updated successfully',
      'user'
    );

    return { success: 'Password updated successfully.' };
  }
);

export const deleteAccount = validatedActionWithUser(
  deleteAccountSchema,
  async (data, formData, user) => {
    const { password } = data;

    // Verify password
    const isValidPassword = await comparePasswords(password, user.passwordHash);
    if (!isValidPassword) {
      return { error: 'Password is incorrect.' };
    }

    // Get user profile for cleanup
    const userWithProfile = await getUserWithProfile();

    // Soft delete user (set deletedAt timestamp)
    await db
      .update(users)
      .set({ 
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));

    // Log the account deletion activity
    await logActivity(
      user.tenantId,
      user.id,
      userWithProfile?.customerProfile?.id || null,
      'ACCOUNT_DELETED',
      'User account deleted by user request',
      'user'
    );

    // Clear session
    const cookieStore = await cookies();
    cookieStore.delete('session');

    // Redirect will be handled by the component
    return { success: 'Account deleted successfully.' };
  }
);

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  redirect('/sign-in');
}