/**
 * Utility functions for generating unique identifiers
 */

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
