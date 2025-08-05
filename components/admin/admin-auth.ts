// features/auth/actions/admin-auth.ts
'use server';

import { redirect as nextRedirect } from 'next/navigation';
import { z } from 'zod';
import { eq, and, isNull } from 'drizzle-orm';
import { compare } from 'bcryptjs';
import { users } from '@/lib/db/schema';
import { setSession } from '@/lib/auth/session';
import { ActionState } from '@/lib/auth/middleware';
import { db } from '@/lib/db/drizzle';

const adminSignInSchema = z.object({
  email: z.string().email().min(1).max(50),
  password: z.string().min(8).max(100),
  redirect: z.string().optional(),
});

export async function signInAdmin(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const validatedData = adminSignInSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
      redirect: formData.get('redirect'),
    });

    const { email, password, redirect } = validatedData;

    // Find admin/staff user
    const existingUser = await (db as any).query.users.findFirst({
      where: and(
        eq(users.email, email),
        isNull(users.deletedAt)
      )
    });

    if (!existingUser) {
      return {
        error: 'Invalid admin credentials',
        email,
        password: '',
      };
    }

    // Check if user is admin or staff
    if (existingUser.userType !== 'admin' && existingUser.userType !== 'staff') {
      return {
        error: 'Access denied. Admin privileges required.',
        email,
        password: '',
      };
    }

    // Verify password
    const isValidPassword = await compare(password, existingUser.passwordHash);
    if (!isValidPassword) {
      return {
        error: 'Invalid admin credentials',
        email,
        password: '',
      };
    }

    // Create session
    await setSession(existingUser);

    // Redirect to admin dashboard or intended page
    nextRedirect(redirect || '/admin');
    
    // This line is unreachable but satisfies TypeScript
    return { error: '' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: 'Invalid input provided',
        email: formData.get('email') as string,
        password: '',
      };
    }

    return {
      error: 'An unexpected error occurred',
      email: formData.get('email') as string,
      password: '',
    };
  }
}