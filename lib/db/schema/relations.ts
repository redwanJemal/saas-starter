import { relations } from 'drizzle-orm';

// Import all tables from their respective modules
import { tenants } from './tenancy';
import { roles, permissions, rolePermissions } from './rbac';
import { users, userRoles } from './users';
import { customerProfiles, companies } from './customers';
import { warehouses, customerWarehouseAssignments } from './warehouses';
import { addresses } from './addresses';
import { packages, packageDocuments, packageStatusHistory } from './packages';
import { shipments, shipmentPackages, shipmentTrackingEvents } from './shipments';
import { financialInvoices, financialInvoiceLines } from './finance';
import { notifications } from './notifications';
import { activityLogs } from './audit';
import { systemSettings, tenantSettings, featureFlags } from './config';
import { 
  countries, 
  currencies, 
  couriers, 
  courierServices, 
  incomingShipments, 
  incomingShipmentItems 
} from './reference';

// =============================================================================
// RELATIONS
// =============================================================================

// Tenant relations
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  roles: many(roles),
  customerProfiles: many(customerProfiles),
  warehouses: many(warehouses),
  tenantSettings: many(tenantSettings),
  activityLogs: many(activityLogs),
  financialInvoices: many(financialInvoices),
  packages: many(packages),
  shipments: many(shipments),
}));

// RBAC relations
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

// User relations
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
  notifications: many(notifications),
  activityLogs: many(activityLogs),
  processedPackages: many(packages, { relationName: 'processedPackages' }),
  createdShipments: many(shipments, { relationName: 'createdShipments' }),
  processedShipments: many(shipments, { relationName: 'processedShipments' }),
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

// Customer relations
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
  }),
  referrer: one(customerProfiles, {
    fields: [customerProfiles.referredBy],
    references: [customerProfiles.id],
  }),
  companies: many(companies),
  addresses: many(addresses),
  warehouseAssignments: many(customerWarehouseAssignments),
  packages: many(packages),
  shipments: many(shipments),
  financialInvoices: many(financialInvoices),
  incomingShipmentItems: many(incomingShipmentItems),
}));

export const companiesRelations = relations(companies, ({ one }) => ({
  tenant: one(tenants, {
    fields: [companies.tenantId],
    references: [tenants.id],
  }),
  owner: one(customerProfiles, {
    fields: [companies.ownerId],
    references: [customerProfiles.id],
  }),
}));

// Warehouse relations
export const warehousesRelations = relations(warehouses, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [warehouses.tenantId],
    references: [tenants.id],
  }),
  customerAssignments: many(customerWarehouseAssignments),
  packages: many(packages),
  shipments: many(shipments),
  incomingShipments: many(incomingShipments),
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
  assignedByUser: one(users, {
    fields: [customerWarehouseAssignments.assignedBy],
    references: [users.id],
    relationName: 'warehouseAssignments'
  }),
}));

// Address relations
export const addressesRelations = relations(addresses, ({ one }) => ({
  customerProfile: one(customerProfiles, {
    fields: [addresses.customerProfileId],
    references: [customerProfiles.id],
  }),
}));

// Package relations
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
  processor: one(users, {
    fields: [packages.processedBy],
    references: [users.id],
  }),
  documents: many(packageDocuments),
  statusHistory: many(packageStatusHistory),
  shipmentPackages: many(shipmentPackages),
}));

export const packageDocumentsRelations = relations(packageDocuments, ({ one }) => ({
  package: one(packages, {
    fields: [packageDocuments.packageId],
    references: [packages.id],
  }),
  uploader: one(users, {
    fields: [packageDocuments.uploadedBy],
    references: [users.id],
  }),
}));

export const packageStatusHistoryRelations = relations(packageStatusHistory, ({ one }) => ({
  package: one(packages, {
    fields: [packageStatusHistory.packageId],
    references: [packages.id],
  }),
  changedByUser: one(users, {
    fields: [packageStatusHistory.changedBy],
    references: [users.id],
  }),
}));

// Shipment relations
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
  shippingAddress: one(addresses, {
    fields: [shipments.shippingAddressId],
    references: [addresses.id],
  }),
  billingAddress: one(addresses, {
    fields: [shipments.billingAddressId],
    references: [addresses.id],
  }),
  company: one(companies, {
    fields: [shipments.companyId],
    references: [companies.id],
  }),
  creator: one(users, {
    fields: [shipments.createdBy],
    references: [users.id],
  }),
  processor: one(users, {
    fields: [shipments.processedBy],
    references: [users.id],
  }),
  shipmentPackages: many(shipmentPackages),
  trackingEvents: many(shipmentTrackingEvents),
  financialInvoice: one(financialInvoices, {
    fields: [shipments.id],
    references: [financialInvoices.shipmentId],
  }),
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

// Finance relations
export const financialInvoicesRelations = relations(financialInvoices, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [financialInvoices.tenantId],
    references: [tenants.id],
  }),
  customerProfile: one(customerProfiles, {
    fields: [financialInvoices.customerProfileId],
    references: [customerProfiles.id],
  }),
  shipment: one(shipments, {
    fields: [financialInvoices.shipmentId],
    references: [shipments.id],
  }),
  invoiceLines: many(financialInvoiceLines),
}));

export const financialInvoiceLinesRelations = relations(financialInvoiceLines, ({ one }) => ({
  invoice: one(financialInvoices, {
    fields: [financialInvoiceLines.invoiceId],
    references: [financialInvoices.id],
  }),
}));

// Notification relations
export const notificationsRelations = relations(notifications, ({ one }) => ({
  tenant: one(tenants, {
    fields: [notifications.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Audit relations
export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [activityLogs.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

// Config relations
export const tenantSettingsRelations = relations(tenantSettings, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tenantSettings.tenantId],
    references: [tenants.id],
  }),
}));

// Reference relations
export const couriersRelations = relations(couriers, ({ many }) => ({
  services: many(courierServices),
}));

export const courierServicesRelations = relations(courierServices, ({ one }) => ({
  courier: one(couriers, {
    fields: [courierServices.courierId],
    references: [couriers.id],
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
  items: many(incomingShipmentItems),
}));

export const incomingShipmentItemsRelations = relations(incomingShipmentItems, ({ one, many }) => ({
  incomingShipment: one(incomingShipments, {
    fields: [incomingShipmentItems.incomingShipmentId],
    references: [incomingShipments.id],
  }),
  customerProfile: one(customerProfiles, {
    fields: [incomingShipmentItems.assignedCustomerProfileId],
    references: [customerProfiles.id],
  }),
  package: many(packages),
}));
