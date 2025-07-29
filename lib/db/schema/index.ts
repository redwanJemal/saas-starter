// lib/db/schema/index.ts
// Main schema exports for Drizzle ORM

// ============================================================================= 
// FEATURE SCHEMAS
// =============================================================================

// Auth & Core
export * from '@/features/auth/db/schema';

// Customers
export * from '@/features/customers/db/schema';

// Warehouse Operations
export * from '@/features/warehouses/db/schema';

// Package Management
export * from '@/features/packages/db/schema';

// Shipping & Logistics
export * from '@/features/shipping/db/schema';

// Finance & Services
export * from '@/features/finance/db/schema';

// Settings & Configuration
export * from '@/features/settings/db/schema';

// Audit & Communications
export * from '@/features/audit/db/schema';

// ============================================================================= 
// RELATIONS
// =============================================================================
export * from './relations';

// ============================================================================= 
// UTILS & HELPERS
// =============================================================================

// Re-export commonly used Drizzle utilities for convenience
export { sql, eq, and, or, not, desc, asc, count, sum, max, min, avg } from 'drizzle-orm';
export type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// Helper type for pagination
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// Standard API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}

// Error response type
export interface ApiError {
  success: false;
  message: string;
  errors?: any[];
  code?: string;
}