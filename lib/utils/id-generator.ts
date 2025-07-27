// lib/utils/id-generator.ts
/**
 * Utility functions for generating unique identifiers
 */

/**
 * Generates a unique package internal ID with the format PKG-XXXXXXXX-XXXXX
 * where XXXXXXXX is a random alphanumeric string and XXXXX is a random 5-character string
 * 
 * @returns {string} A unique package internal ID
 */
export function generatePackageInternalId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `PKG-${timestamp}-${random}`;
}

/**
 * Generates a unique shipment number with the format SHP-YYYYMMDD-XXXXX
 * where XXXXX is a random 5-digit number
 * 
 * @returns {string} A unique shipment number
 */
export function generateShipmentNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateString = `${year}${month}${day}`;
  
  // Generate a random 5-digit number
  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  
  return `SHP-${dateString}-${randomDigits}`;
}

/**
 * Generates a unique invoice number with the format INV-YYYYMMDD-XXXXX
 * where XXXXX is a random 5-digit number
 * 
 * @param {string} [prefix='INV'] - Optional prefix for the invoice number
 * @returns {string} A unique invoice number
 */
export function generateInvoiceNumber(prefix: string = 'INV'): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateString = `${year}${month}${day}`;
  
  // Generate a random 5-digit number
  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  
  return `${prefix}-${dateString}-${randomDigits}`;
}

/**
 * Generates a unique tracking number with the format TRK-XXXXX-XXXXX
 * where XXXXX are random 5-digit numbers
 * 
 * @returns {string} A unique tracking number
 */
export function generateTrackingNumber(): string {
  // Generate two random 5-digit numbers
  const randomDigits1 = Math.floor(10000 + Math.random() * 90000);
  const randomDigits2 = Math.floor(10000 + Math.random() * 90000);
  
  return `TRK-${randomDigits1}-${randomDigits2}`;
}

/**
 * Generates a unique customer ID with the format PF-XXXXXXXX
 * where XXXXXXXX is a random 8-digit number
 * 
 * @returns {string} A unique customer ID
 */
export function generateCustomerId(): string {
  // Generate a random 8-digit number
  const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
  
  return `PF-${randomDigits}`;
}

/**
 * Generates a unique suite code with the format PF-XXXXXXXX
 * where XXXXXXXX is a random 8-digit number (same as customer ID)
 * 
 * @returns {string} A unique suite code
 */
export function generateSuiteCode(): string {
  return generateCustomerId(); // Same format as customer ID
}

/**
 * Generates a unique batch reference with the format BAT-YYYYMMDD-XXXX
 * where XXXX is a random 4-digit number
 * 
 * @returns {string} A unique batch reference
 */
export function generateBatchReference(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateString = `${year}${month}${day}`;
  
  // Generate a random 4-digit number
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  
  return `BAT-${dateString}-${randomDigits}`;
}