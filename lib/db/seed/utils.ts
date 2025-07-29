// lib/db/seed/utils.ts
import { randomBytes } from 'crypto';

export function generateId(): string {
  return randomBytes(16).toString('hex');
}

export function generateCustomerId(): string {
  const prefix = 'PF';
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${randomPart}`;
}

export function generateTrackingNumber(): string {
  const prefix = 'TRK';
  const randomPart = Math.random().toString(36).substring(2, 12).toUpperCase();
  return `${prefix}${randomPart}`;
}

export function generateInvoiceNumber(): string {
  const prefix = 'INV';
  const timestamp = Date.now().toString().slice(-6);
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${randomPart}`;
}

export function generateShipmentNumber(): string {
  const prefix = 'SHP';
  const timestamp = Date.now().toString().slice(-6);
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${randomPart}`;
}

export function generateRequestNumber(): string {
  const prefix = 'PS';
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${timestamp}`;
}

export function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

export function randomFutureDate(days: number = 30): Date {
  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return randomDate(now, future);
}

export function randomPastDate(days: number = 30): Date {
  const now = new Date();
  const past = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return randomDate(past, now);
}

export function randomDecimal(min: number, max: number, decimals: number = 2): string {
  const value = Math.random() * (max - min) + min;
  return value.toFixed(decimals);
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomBoolean(probability: number = 0.5): boolean {
  return Math.random() < probability;
}

// Sample data arrays
export const sampleNames = [
  'John Smith', 'Jane Doe', 'Michael Johnson', 'Sarah Wilson', 'David Brown',
  'Emily Davis', 'James Miller', 'Emma Garcia', 'William Martinez', 'Olivia Rodriguez',
  'Alexander Thompson', 'Isabella White', 'Benjamin Harris', 'Ava Clark', 'Lucas Lewis',
  'Sophia Lee', 'Henry Walker', 'Charlotte Hall', 'Owen Allen', 'Amelia Young'
];

export const sampleCompanies = [
  'Tech Solutions Inc', 'Global Trading Co', 'Innovative Systems Ltd',
  'Digital Commerce Group', 'International Logistics', 'Modern Electronics',
  'Advanced Manufacturing', 'Creative Designs LLC', 'Strategic Consulting',
  'Premium Services Corp', 'Dynamic Solutions', 'Future Technologies'
];

export const sampleAddresses = [
  { address: '123 Main St', city: 'New York', state: 'NY', country: 'US', postal: '10001' },
  { address: '456 Oak Ave', city: 'Los Angeles', state: 'CA', country: 'US', postal: '90210' },
  { address: '789 Pine Rd', city: 'Chicago', state: 'IL', country: 'US', postal: '60601' },
  { address: '321 Elm St', city: 'Houston', state: 'TX', country: 'US', postal: '77001' },
  { address: '654 Maple Dr', city: 'Phoenix', state: 'AZ', country: 'US', postal: '85001' },
  { address: '987 Cedar Ln', city: 'Philadelphia', state: 'PA', country: 'US', postal: '19101' },
  { address: '147 Birch Ct', city: 'San Antonio', state: 'TX', country: 'US', postal: '78201' },
  { address: '258 Spruce Way', city: 'San Diego', state: 'CA', country: 'US', postal: '92101' },
  { address: '369 Ash Blvd', city: 'Dallas', state: 'TX', country: 'US', postal: '75201' },
  { address: '741 Walnut St', city: 'San Jose', state: 'CA', country: 'US', postal: '95101' }
];

export const sampleCountries = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'UK', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' }
];

export const sampleProductDescriptions = [
  'Electronics - Smartphone', 'Clothing - T-Shirt', 'Books - Novel',
  'Electronics - Headphones', 'Home & Garden - Kitchen Utensils',
  'Toys - Action Figure', 'Sports - Running Shoes', 'Beauty - Skincare Set',
  'Electronics - Tablet', 'Clothing - Jeans', 'Books - Technical Manual',
  'Home & Garden - Decorative Vase', 'Electronics - Smartwatch',
  'Clothing - Winter Jacket', 'Sports - Yoga Mat', 'Beauty - Makeup Kit'
];

export const packageStatuses = ['expected', 'received', 'processing', 'ready_to_ship', 'shipped', 'delivered'] as const;
export const shipmentStatuses = ['quote_requested', 'quoted', 'paid', 'processing', 'dispatched', 'in_transit', 'delivered'] as const;
export const customerStatuses = ['active', 'inactive', 'suspended'] as const;
export const warehouseStatuses = ['active', 'inactive', 'maintenance'] as const;
export const invoiceStatuses = ['pending', 'paid', 'overdue', 'cancelled'] as const;

export function logSeedProgress(message: string) {
  console.log(`🌱 ${message}`);
}

export function logSeedError(message: string, error?: any) {
  console.error(`❌ ${message}`, error);
}

export function logSeedSuccess(message: string) {
  console.log(`✅ ${message}`);
}