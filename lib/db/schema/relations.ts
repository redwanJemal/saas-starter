// lib/db/schema/relations.ts
import { relations } from 'drizzle-orm';

// Import all tables from feature schemas
import { tenants, users, roles, permissions, rolePermissions, userRoles } from '@/features/auth/db/schema';
import { customerProfiles, companies } from '@/features/customers/db/schema';
import { warehouses, customerWarehouseAssignments, storagePricing, binLocations, packageBinAssignments, storageCharges } from '@/features/warehouses/db/schema';
import { packages, packageStatusHistory, incomingShipments, incomingShipmentItems } from '@/features/packages/db/schema';
import { zones, zoneCountries, shippingRates, shipments, shipmentPackages, shipmentTrackingEvents, shipmentStatusHistory } from '@/features/shipping/db/schema';
import { invoices, invoiceLines, personalShopperRequests, personalShopperRequestItems, personalShopperRequestStatusHistory } from '@/features/finance/db/schema';
import { countries, currencies, couriers, courierServices, tenantCurrencies, tenantCouriers } from '@/features/settings/db/schema';
import { documents, entityDocuments, addresses, entityAddresses } from '@/features/settings/db/schema';
import { activityLogs, notifications, notificationTemplates, complianceEvents } from '@/features/audit/db/schema';

// ============================================================================= 
// TENANT RELATIONS
// =============================================================================
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  roles: many(roles),
  customerProfiles: many(customerProfiles),
  warehouses: many(warehouses),
  zones: many(zones),
  shippingRates: many(shippingRates),
  shipments: many(shipments),
  packages: many(packages),
  invoices: many(invoices),
  personalShopperRequests: many(personalShopperRequests),
  storagePricing: many(storagePricing),
  binLocations: many(binLocations),
  storageCharges: many(storageCharges),
  incomingShipments: many(incomingShipments),
  incomingShipmentItems: many(incomingShipmentItems),
  tenantCurrencies: many(tenantCurrencies),
  tenantCouriers: many(tenantCouriers),
  documents: many(documents),
  addresses: many(addresses),
  activityLogs: many(activityLogs),
  notifications: many(notifications),
  notificationTemplates: many(notificationTemplates),
  complianceEvents: many(complianceEvents),
  companies: many(companies),
}));

// ============================================================================= 
// AUTH RELATIONS
// =============================================================================
export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  customerProfile: one(customerProfiles, {
    fields: [users.id],
    references: [customerProfiles.userId],
  }),
  userRoles: many(userRoles, { relationName: 'userRoleAssignments' }),
  roleAssignments: many(userRoles, { relationName: 'roleAssignments' }),
  kycVerifications: many(customerProfiles, { relationName: 'kycVerifications' }),
  warehouseAssignments: many(customerWarehouseAssignments, { relationName: 'warehouseAssignments' }),
  processedPackages: many(packages, { relationName: 'processedPackages' }),
  createdShipments: many(shipments, { relationName: 'createdShipments' }),
  processedShipments: many(shipments, { relationName: 'processedShipments' }),
  quotedPersonalShopperRequests: many(personalShopperRequests, { relationName: 'quotedRequests' }),
  purchasedPersonalShopperRequests: many(personalShopperRequests, { relationName: 'purchasedRequests' }),
  receivedIncomingShipments: many(incomingShipments, { relationName: 'receivedShipments' }),
  processedIncomingShipments: many(incomingShipments, { relationName: 'processedShipments' }),
  scannedItems: many(incomingShipmentItems, { relationName: 'scannedItems' }),
  assignedItems: many(incomingShipmentItems, { relationName: 'assignedItems' }),
  notifications: many(notifications),
  activityLogs: many(activityLogs),
  uploadedDocuments: many(documents, { relationName: 'uploadedDocuments' }),
  attachedDocuments: many(entityDocuments, { relationName: 'attachedDocuments' }),
  createdAddresses: many(addresses, { relationName: 'createdAddresses' }),
  assignedAddresses: many(entityAddresses, { relationName: 'assignedAddresses' }),
  companyVerifications: many(companies, { relationName: 'companyVerifications' }),
  suspendedCustomers: many(customerProfiles, { relationName: 'suspendedCustomers' }),
  accountManagers: many(companies, { relationName: 'accountManagers' }),
  statusChanges: many(packageStatusHistory, { relationName: 'statusChanges' }),
  shipmentStatusChanges: many(shipmentStatusHistory, { relationName: 'shipmentStatusChanges' }),
  personalShopperStatusChanges: many(personalShopperRequestStatusHistory, { relationName: 'personalShopperStatusChanges' }),
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [roles.tenantId],
    references: [tenants.id],
  }),
  rolePermissions: many(rolePermissions),
  userRoles: many(userRoles),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
    relationName: 'userRoleAssignments'
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
  assignedByUser: one(users, {
    fields: [userRoles.assignedBy],
    references: [users.id],
    relationName: 'roleAssignments'
  }),
}));

// ============================================================================= 
// CUSTOMER RELATIONS
// =============================================================================
export const customerProfilesRelations = relations(customerProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [customerProfiles.userId],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [customerProfiles.tenantId],
    references: [tenants.id],
  }),
  kycVerifier: one(users, {
    fields: [customerProfiles.kycVerifiedBy],
    references: [users.id],
    relationName: 'kycVerifications'
  }),
  suspendedBy: one(users, {
    fields: [customerProfiles.suspendedBy],
    references: [users.id],
    relationName: 'suspendedCustomers'
  }),
  referrer: one(customerProfiles, {
    fields: [customerProfiles.referredBy],
    references: [customerProfiles.id],
    relationName: 'referrals'
  }),
  referrals: many(customerProfiles, { relationName: 'referrals' }),
  companies: many(companies),
  warehouseAssignments: many(customerWarehouseAssignments),
  packages: many(packages),
  shipments: many(shipments),
  invoices: many(invoices),
  personalShopperRequests: many(personalShopperRequests),
  assignedIncomingItems: many(incomingShipmentItems),
  notifications: many(notifications),
  activityLogs: many(activityLogs),
  complianceEvents: many(complianceEvents),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [companies.tenantId],
    references: [tenants.id],
  }),
  owner: one(customerProfiles, {
    fields: [companies.ownerId],
    references: [customerProfiles.id],
  }),
  verifiedBy: one(users, {
    fields: [companies.verifiedBy],
    references: [users.id],
    relationName: 'companyVerifications'
  }),
  accountManager: one(users, {
    fields: [companies.accountManagerId],
    references: [users.id],
    relationName: 'accountManagers'
  }),
  shipments: many(shipments),
}));

// ============================================================================= 
// WAREHOUSE RELATIONS
// =============================================================================
export const warehousesRelations = relations(warehouses, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [warehouses.tenantId],
    references: [tenants.id],
  }),
  customerAssignments: many(customerWarehouseAssignments),
  packages: many(packages),
  shipments: many(shipments),
  incomingShipments: many(incomingShipments),
  incomingShipmentItems: many(incomingShipmentItems),
  storagePricing: many(storagePricing),
  binLocations: many(binLocations),
  shippingRates: many(shippingRates),
}));

export const customerWarehouseAssignmentsRelations = relations(customerWarehouseAssignments, ({ one }) => ({
  customerProfile: one(customerProfiles, {
    fields: [customerWarehouseAssignments.customerProfileId],
    references: [customerProfiles.id],
  }),
  warehouse: one(warehouses, {
    fields: [customerWarehouseAssignments.warehouseId],
    references: [warehouses.id],
  }),
  assignedBy: one(users, {
    fields: [customerWarehouseAssignments.assignedBy],
    references: [users.id],
    relationName: 'warehouseAssignments'
  }),
}));

export const storagePricingRelations = relations(storagePricing, ({ one }) => ({
  tenant: one(tenants, {
    fields: [storagePricing.tenantId],
    references: [tenants.id],
  }),
  warehouse: one(warehouses, {
    fields: [storagePricing.warehouseId],
    references: [warehouses.id],
  }),
}));

export const binLocationsRelations = relations(binLocations, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [binLocations.tenantId],
    references: [tenants.id],
  }),
  warehouse: one(warehouses, {
    fields: [binLocations.warehouseId],
    references: [warehouses.id],
  }),
  packageAssignments: many(packageBinAssignments),
  storageCharges: many(storageCharges),
}));

export const packageBinAssignmentsRelations = relations(packageBinAssignments, ({ one }) => ({
  package: one(packages, {
    fields: [packageBinAssignments.packageId],
    references: [packages.id],
  }),
  binLocation: one(binLocations, {
    fields: [packageBinAssignments.binId],
    references: [binLocations.id],
  }),
}));

export const storageChargesRelations = relations(storageCharges, ({ one }) => ({
  package: one(packages, {
    fields: [storageCharges.packageId],
    references: [packages.id],
  }),
  tenant: one(tenants, {
    fields: [storageCharges.tenantId],
    references: [tenants.id],
  }),
  binLocation: one(binLocations, {
    fields: [storageCharges.binLocationId],
    references: [binLocations.id],
  }),
}));

// ============================================================================= 
// PACKAGE RELATIONS
// =============================================================================
export const packagesRelations = relations(packages, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [packages.tenantId],
    references: [tenants.id],
  }),
  customerProfile: one(customerProfiles, {
    fields: [packages.customerProfileId],
    references: [customerProfiles.id],
  }),
  warehouse: one(warehouses, {
    fields: [packages.warehouseId],
    references: [warehouses.id],
  }),
  incomingShipmentItem: one(incomingShipmentItems, {
    fields: [packages.incomingShipmentItemId],
    references: [incomingShipmentItems.id],
  }),
  processedBy: one(users, {
    fields: [packages.processedBy],
    references: [users.id],
    relationName: 'processedPackages'
  }),
  statusHistory: many(packageStatusHistory),
  shipmentPackages: many(shipmentPackages),
  binAssignments: many(packageBinAssignments),
  storageCharges: many(storageCharges),
  personalShopperItems: many(personalShopperRequestItems),
}));

export const packageStatusHistoryRelations = relations(packageStatusHistory, ({ one }) => ({
  package: one(packages, {
    fields: [packageStatusHistory.packageId],
    references: [packages.id],
  }),
  changedBy: one(users, {
    fields: [packageStatusHistory.changedBy],
    references: [users.id],
    relationName: 'statusChanges'
  }),
}));

export const incomingShipmentsRelations = relations(incomingShipments, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [incomingShipments.tenantId],
    references: [tenants.id],
  }),
  warehouse: one(warehouses, {
    fields: [incomingShipments.warehouseId],
    references: [warehouses.id],
  }),
  courier: one(couriers, {
    fields: [incomingShipments.courierId],
    references: [couriers.id],
  }),
  receivedBy: one(users, {
    fields: [incomingShipments.receivedBy],
    references: [users.id],
    relationName: 'receivedShipments'
  }),
  processedBy: one(users, {
    fields: [incomingShipments.processedBy],
    references: [users.id],
    relationName: 'processedShipments'
  }),
  items: many(incomingShipmentItems),
}));

export const incomingShipmentItemsRelations = relations(incomingShipmentItems, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [incomingShipmentItems.tenantId],
    references: [tenants.id],
  }),
  warehouse: one(warehouses, {
    fields: [incomingShipmentItems.warehouseId],
    references: [warehouses.id],
  }),
  incomingShipment: one(incomingShipments, {
    fields: [incomingShipmentItems.incomingShipmentId],
    references: [incomingShipments.id],
  }),
  scannedBy: one(users, {
    fields: [incomingShipmentItems.scannedBy],
    references: [users.id],
    relationName: 'scannedItems'
  }),
  assignedCustomer: one(customerProfiles, {
    fields: [incomingShipmentItems.assignedCustomerProfileId],
    references: [customerProfiles.id],
  }),
  assignedBy: one(users, {
    fields: [incomingShipmentItems.assignedBy],
    references: [users.id],
    relationName: 'assignedItems'
  }),
  packages: many(packages),
}));

// ============================================================================= 
// SHIPPING RELATIONS
// =============================================================================
export const zonesRelations = relations(zones, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [zones.tenantId],
    references: [tenants.id],
  }),
  countries: many(zoneCountries),
  shippingRates: many(shippingRates),
  shipments: many(shipments),
}));

export const zoneCountriesRelations = relations(zoneCountries, ({ one }) => ({
  zone: one(zones, {
    fields: [zoneCountries.zoneId],
    references: [zones.id],
  }),
  country: one(countries, {
    fields: [zoneCountries.countryCode],
    references: [countries.code],
  }),
}));

export const shippingRatesRelations = relations(shippingRates, ({ one }) => ({
  tenant: one(tenants, {
    fields: [shippingRates.tenantId],
    references: [tenants.id],
  }),
  warehouse: one(warehouses, {
    fields: [shippingRates.warehouseId],
    references: [warehouses.id],
  }),
  zone: one(zones, {
    fields: [shippingRates.zoneId],
    references: [zones.id],
  }),
}));

export const shipmentsRelations = relations(shipments, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [shipments.tenantId],
    references: [tenants.id],
  }),
  customerProfile: one(customerProfiles, {
    fields: [shipments.customerProfileId],
    references: [customerProfiles.id],
  }),
  warehouse: one(warehouses, {
    fields: [shipments.warehouseId],
    references: [warehouses.id],
  }),
  company: one(companies, {
    fields: [shipments.companyId],
    references: [companies.id],
  }),
  zone: one(zones, {
    fields: [shipments.zoneId],
    references: [zones.id],
  }),
  createdBy: one(users, {
    fields: [shipments.createdBy],
    references: [users.id],
    relationName: 'createdShipments'
  }),
  processedBy: one(users, {
    fields: [shipments.processedBy],
    references: [users.id],
    relationName: 'processedShipments'
  }),
  packages: many(shipmentPackages),
  trackingEvents: many(shipmentTrackingEvents),
  statusHistory: many(shipmentStatusHistory),
  invoices: many(invoices),
}));

export const shipmentPackagesRelations = relations(shipmentPackages, ({ one }) => ({
  shipment: one(shipments, {
    fields: [shipmentPackages.shipmentId],
    references: [shipments.id],
  }),
  package: one(packages, {
    fields: [shipmentPackages.packageId],
    references: [packages.id],
  }),
}));

export const shipmentTrackingEventsRelations = relations(shipmentTrackingEvents, ({ one }) => ({
  shipment: one(shipments, {
    fields: [shipmentTrackingEvents.shipmentId],
    references: [shipments.id],
  }),
}));

export const shipmentStatusHistoryRelations = relations(shipmentStatusHistory, ({ one }) => ({
  shipment: one(shipments, {
    fields: [shipmentStatusHistory.shipmentId],
    references: [shipments.id],
  }),
  changedBy: one(users, {
    fields: [shipmentStatusHistory.changedBy],
    references: [users.id],
    relationName: 'shipmentStatusChanges'
  }),
}));

// ============================================================================= 
// FINANCE RELATIONS
// =============================================================================
export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [invoices.tenantId],
    references: [tenants.id],
  }),
  customerProfile: one(customerProfiles, {
    fields: [invoices.customerProfileId],
    references: [customerProfiles.id],
  }),
  shipment: one(shipments, {
    fields: [invoices.shipmentId],
    references: [shipments.id],
  }),
  personalShopperRequest: one(personalShopperRequests, {
    fields: [invoices.personalShopperRequestId],
    references: [personalShopperRequests.id],
  }),
  lines: many(invoiceLines),
}));

export const invoiceLinesRelations = relations(invoiceLines, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceLines.invoiceId],
    references: [invoices.id],
  }),
}));

export const personalShopperRequestsRelations = relations(personalShopperRequests, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [personalShopperRequests.tenantId],
    references: [tenants.id],
  }),
  customerProfile: one(customerProfiles, {
    fields: [personalShopperRequests.customerProfileId],
    references: [customerProfiles.id],
  }),
  quotedBy: one(users, {
    fields: [personalShopperRequests.quotedBy],
    references: [users.id],
    relationName: 'quotedRequests'
  }),
  purchasedBy: one(users, {
    fields: [personalShopperRequests.purchasedBy],
    references: [users.id],
    relationName: 'purchasedRequests'
  }),
  items: many(personalShopperRequestItems),
  statusHistory: many(personalShopperRequestStatusHistory),
  invoices: many(invoices),
}));

export const personalShopperRequestItemsRelations = relations(personalShopperRequestItems, ({ one }) => ({
  personalShopperRequest: one(personalShopperRequests, {
    fields: [personalShopperRequestItems.personalShopperRequestId],
    references: [personalShopperRequests.id],
  }),
  package: one(packages, {
    fields: [personalShopperRequestItems.packageId],
    references: [packages.id],
  }),
}));

export const personalShopperRequestStatusHistoryRelations = relations(personalShopperRequestStatusHistory, ({ one }) => ({
  personalShopperRequest: one(personalShopperRequests, {
    fields: [personalShopperRequestStatusHistory.personalShopperRequestId],
    references: [personalShopperRequests.id],
  }),
  changedBy: one(users, {
    fields: [personalShopperRequestStatusHistory.changedBy],
    references: [users.id],
    relationName: 'personalShopperStatusChanges'
  }),
}));

// ============================================================================= 
// SETTINGS RELATIONS
// =============================================================================
export const countriesRelations = relations(countries, ({ many }) => ({
  zoneCountries: many(zoneCountries),
}));

export const currenciesRelations = relations(currencies, ({ many }) => ({
  tenantCurrencies: many(tenantCurrencies),
}));

export const couriersRelations = relations(couriers, ({ many }) => ({
  services: many(courierServices),
  tenantCouriers: many(tenantCouriers),
  incomingShipments: many(incomingShipments),
}));

export const courierServicesRelations = relations(courierServices, ({ one }) => ({
  courier: one(couriers, {
    fields: [courierServices.courierId],
    references: [couriers.id],
  }),
}));

export const tenantCurrenciesRelations = relations(tenantCurrencies, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tenantCurrencies.tenantId],
    references: [tenants.id],
  }),
  currency: one(currencies, {
    fields: [tenantCurrencies.currencyId],
    references: [currencies.id],
  }),
}));

export const tenantCouriersRelations = relations(tenantCouriers, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tenantCouriers.tenantId],
    references: [tenants.id],
  }),
  courier: one(couriers, {
    fields: [tenantCouriers.courierId],
    references: [couriers.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [documents.tenantId],
    references: [tenants.id],
  }),
  uploadedBy: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
    relationName: 'uploadedDocuments'
  }),
  entityDocuments: many(entityDocuments),
}));

export const entityDocumentsRelations = relations(entityDocuments, ({ one }) => ({
  document: one(documents, {
    fields: [entityDocuments.documentId],
    references: [documents.id],
  }),
  attachedBy: one(users, {
    fields: [entityDocuments.attachedBy],
    references: [users.id],
    relationName: 'attachedDocuments'
  }),
}));

export const addressesRelations = relations(addresses, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [addresses.tenantId],
    references: [tenants.id],
  }),
  createdBy: one(users, {
    fields: [addresses.createdBy],
    references: [users.id],
    relationName: 'createdAddresses'
  }),
  entityAddresses: many(entityAddresses),
}));

export const entityAddressesRelations = relations(entityAddresses, ({ one }) => ({
  address: one(addresses, {
    fields: [entityAddresses.addressId],
    references: [addresses.id],
  }),
  assignedBy: one(users, {
    fields: [entityAddresses.assignedBy],
    references: [users.id],
    relationName: 'assignedAddresses'
  }),
}));

// ============================================================================= 
// AUDIT RELATIONS
// =============================================================================
export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [activityLogs.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
  customerProfile: one(customerProfiles, {
    fields: [activityLogs.customerProfileId],
    references: [customerProfiles.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  tenant: one(tenants, {
    fields: [notifications.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  customerProfile: one(customerProfiles, {
    fields: [notifications.customerProfileId],
    references: [customerProfiles.id],
  }),
}));

export const notificationTemplatesRelations = relations(notificationTemplates, ({ one }) => ({
  tenant: one(tenants, {
    fields: [notificationTemplates.tenantId],
    references: [tenants.id],
  }),
}));

export const complianceEventsRelations = relations(complianceEvents, ({ one }) => ({
  tenant: one(tenants, {
    fields: [complianceEvents.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [complianceEvents.userId],
    references: [users.id],
  }),
  customerProfile: one(customerProfiles, {
    fields: [complianceEvents.customerProfileId],
    references: [customerProfiles.id],
  }),
}));