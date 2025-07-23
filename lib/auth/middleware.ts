// lib/auth/middleware.ts - Add the missing withTeam function and other updates
import { z } from 'zod';
import { User, CustomerProfile } from '@/lib/db/schema';
import { getUser, getUserWithProfile } from '@/lib/db/queries';
import { redirect } from 'next/navigation';

export type ActionState = {
  error?: string;
  success?: string;
  [key: string]: any; // This allows for additional properties
};

type ValidatedActionFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData
) => Promise<T>;

export function validatedAction<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData) => {
    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.errors[0].message };
    }
    return action(result.data, formData);
  };
}

type ValidatedActionWithUserFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData,
  user: User
) => Promise<T>;

export function validatedActionWithUser<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionWithUserFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData) => {
    const user = await getUser();
    if (!user) {
      throw new Error('User is not authenticated');
    }

    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.errors[0].message };
    }

    return action(result.data, formData, user);
  };
}

// Add withTeam compatibility function (maps to customer profile)
type ValidatedActionWithCustomerFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData,
  customerProfile: CustomerProfile
) => Promise<T>;

export function withCustomer<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionWithCustomerFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData) => {
    const userWithProfile = await getUserWithProfile();
    
    if (!userWithProfile?.customerProfile) {
      redirect('/sign-up');
    }

    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.errors[0].message };
    }

    return action(result.data, formData, userWithProfile.customerProfile);
  };
}

// Compatibility alias for existing code
export const withTeam = withCustomer;