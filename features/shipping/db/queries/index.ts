// features/shipping/db/queries/index.ts

// Export all shipping-related query functions

// Zone queries
export { getZones } from './zones/get-zones.query';
export { getZoneById } from './zones/get-zone-by-id.query';
export { createZone } from './zones/create-zone.query';
export { updateZone } from './zones/update-zone.query';
export { deleteZone } from './zones/delete-zone.query';
export { getZoneCountries } from './zones/get-zone-countries.query';

// Shipping rate queries  
export { getShippingRates } from './rates/get-shipping-rates.query';
export { getShippingRateById } from './rates/get-shipping-rate-by-id.query';
export { createShippingRate } from './rates/create-shipping-rate.query';
export { updateShippingRate } from './rates/update-shipping-rate.query';
export { deleteShippingRate } from './rates/delete-shipping-rate.query';
export { calculateShippingRates } from './rates/calculate-shipping-rates.query';
export { getActiveRatesForZone } from './rates/get-active-rates-for-zone.query';

// Transform utilities
export { transformZone } from './utils/transform-zone.query';
export { transformShippingRate } from './utils/transform-shipping-rate.query';
export { transformShipment } from './utils/transform-shipment.query';

// Note: The following modules are planned but not yet implemented:
// - Shipment queries (get-shipments, get-shipment-by-id, create-shipment, etc.)
// - Tracking queries (create-tracking-event, get-shipment-tracking-events, etc.)
// - Statistics queries (get-shipping-statistics, get-zone-statistics, etc.)