// lib/auth/middleware.ts

/**
 * ActionState interface for authentication actions
 * Used by the admin login form and server actions
 */
export interface ActionState {
  error?: string;
  email?: string;
  password?: string;
  redirect?: string;
}
