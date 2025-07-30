// features/warehouses/db/queries/index.ts

// Export all warehouse-related query functions

// Warehouse queries
export { getWarehouses } from './warehouses/get-warehouses.query';
export { getWarehouseById } from './warehouses/get-warehouse-by-id.query';
export { createWarehouse } from './warehouses/create-warehouse.query';
export { updateWarehouse } from './warehouses/update-warehouse.query';
export { deleteWarehouse } from './warehouses/delete-warehouse.query';

// Customer warehouse assignment queries
export { getCustomerWarehouseAssignments } from './assignments/get-customer-warehouse-assignments.query';
export { getCustomerWarehouseAssignmentById } from './assignments/get-customer-warehouse-assignment-by-id.query';
export { createCustomerWarehouseAssignment } from './assignments/create-customer-warehouse-assignment.query';
export { updateCustomerWarehouseAssignment } from './assignments/update-customer-warehouse-assignment.query';
export { deleteCustomerWarehouseAssignment } from './assignments/delete-customer-warehouse-assignment.query';

// Storage pricing queries
export { getStoragePricing } from './storage/get-storage-pricing.query';
export { getStoragePricingById } from './storage/get-storage-pricing-by-id.query';
export { createStoragePricing } from './storage/create-storage-pricing.query';
export { updateStoragePricing } from './storage/update-storage-pricing.query';
export { deleteStoragePricing } from './storage/delete-storage-pricing.query';
export { getActiveStoragePricing } from './storage/get-active-storage-pricing.query';

// Bin location queries
export { getBinLocations } from './bins/get-bin-locations.query';
export { getBinLocationById } from './bins/get-bin-location-by-id.query';
export { createBinLocation } from './bins/create-bin-location.query';
export { updateBinLocation } from './bins/update-bin-location.query';
export { deleteBinLocation } from './bins/delete-bin-location.query';
export { getAvailableBinLocations } from './bins/get-available-bin-locations.query';

// Package bin assignment queries
export { getPackageBinAssignments } from './bins/get-package-bin-assignments.query';
export { getPackageBinAssignmentById } from './bins/get-package-bin-assignment-by-id.query';
export { createPackageBinAssignment } from './bins/create-package-bin-assignment.query';
export { removePackageBinAssignment } from './bins/remove-package-bin-assignment.query';

// Storage charge queries
export { getStorageCharges } from './storage/get-storage-charges.query';
export { getStorageChargeById } from './storage/get-storage-charge-by-id.query';
export { createStorageCharge } from './storage/create-storage-charge.query';
export { calculateStorageCharges } from './storage/calculate-storage-charges.query';
export { getUnbilledStorageCharges } from './storage/get-unbilled-storage-charges.query';
export { markStorageChargesInvoiced } from './storage/mark-storage-charges-invoiced.query';

// Utility queries
export { getWarehouseStatistics } from './utils/get-warehouse-statistics.query';
export { getWarehouseCapacity } from './utils/get-warehouse-capacity.query';