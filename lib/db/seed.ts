import { db } from './drizzle';
import {
  tenants,
  users,
  roles,
  permissions,
  rolePermissions,
  userRoles,
  customerProfiles,
  warehouses,
  customerWarehouseAssignments,
  systemConfigs,
  DEFAULT_TENANT_SLUG,
  CUSTOMER_ID_PREFIX,
  CUSTOMER_ID_LENGTH,
  type CustomerProfile,
} from './schema';
import { hashPassword } from '@/lib/auth/session';
import { seedMasterData } from './seed-master-data';

async function seed() {
  console.log('🌱 Starting database seed...');
  
  // 1. Seed master data first (countries, currencies, couriers)
  console.log('📊 Step 1: Seeding master data...');
  await seedMasterData();

  // 2. Create default tenant
  const [defaultTenant] = await db.insert(tenants).values({
    name: 'Package Forwarding Platform',
    slug: DEFAULT_TENANT_SLUG,
    companyName: 'Package Forwarding Platform Ltd',
    status: 'active',
  }).returning();

  console.log('✅ Default tenant created');

  // 3. Create permissions
  const permissionData = [
    // Admin permissions
    { name: 'Admin Management', slug: 'admin.manage', category: 'admin', action: 'manage' },
    
    // Package permissions
    { name: 'View Packages', slug: 'packages.read', category: 'packages', action: 'read' },
    { name: 'Create Packages', slug: 'packages.create', category: 'packages', action: 'create' },
    { name: 'Update Packages', slug: 'packages.update', category: 'packages', action: 'update' },
    { name: 'Delete Packages', slug: 'packages.delete', category: 'packages', action: 'delete' },
    
    // Shipment permissions
    { name: 'View Shipments', slug: 'shipments.read', category: 'shipments', action: 'read' },
    { name: 'Create Shipments', slug: 'shipments.create', category: 'shipments', action: 'create' },
    { name: 'Update Shipments', slug: 'shipments.update', category: 'shipments', action: 'update' },
    { name: 'Process Shipments', slug: 'shipments.process', category: 'shipments', action: 'process' },
    
    // Customer permissions
    { name: 'View Customers', slug: 'customers.read', category: 'customers', action: 'read' },
    { name: 'Update Customers', slug: 'customers.update', category: 'customers', action: 'update' },
    { name: 'Manage Customers', slug: 'customers.manage', category: 'customers', action: 'manage' },
    
    // Financial permissions
    { name: 'View Invoices', slug: 'invoices.read', category: 'invoices', action: 'read' },
    { name: 'Create Invoices', slug: 'invoices.create', category: 'invoices', action: 'create' },
    { name: 'Process Payments', slug: 'payments.process', category: 'payments', action: 'process' },
    
    // Admin permissions
    { name: 'Manage Warehouses', slug: 'warehouses.manage', category: 'warehouses', action: 'manage' },
    { name: 'Manage Users', slug: 'users.manage', category: 'users', action: 'manage' },
    { name: 'View Reports', slug: 'reports.read', category: 'reports', action: 'read' },
    { name: 'System Configuration', slug: 'system.config', category: 'system', action: 'config' },
  ];

  const createdPermissions = await db.insert(permissions).values(permissionData).returning();
  console.log('✅ Permissions created');

  // 4. Create roles
  const roleData = [
    { tenantId: defaultTenant.id, name: 'Customer', slug: 'customer', description: 'Regular platform customer', roleType: 'customer' as const, isSystemRole: true },
    { tenantId: defaultTenant.id, name: 'Warehouse Staff', slug: 'warehouse_staff', description: 'Warehouse operations staff', roleType: 'staff' as const, isSystemRole: true },
    { tenantId: defaultTenant.id, name: 'Customer Service', slug: 'customer_service', description: 'Customer support representative', roleType: 'staff' as const, isSystemRole: true },
    { tenantId: defaultTenant.id, name: 'Admin', slug: 'admin', description: 'Platform administrator', roleType: 'admin' as const, isSystemRole: true },
    { tenantId: defaultTenant.id, name: 'Super Admin', slug: 'super_admin', description: 'System super administrator', roleType: 'admin' as const, isSystemRole: true },
  ];

  const createdRoles = await db.insert(roles).values(roleData).returning();
  console.log('✅ Roles created');

  // 5. Assign permissions to roles
  const rolePermissionMappings = [
    // Customer permissions
    {
      roleSlug: 'customer',
      permissionSlugs: ['packages.read', 'shipments.read', 'shipments.create', 'invoices.read']
    },
    // Warehouse Staff permissions
    {
      roleSlug: 'warehouse_staff',
      permissionSlugs: [
        'packages.read', 'packages.create', 'packages.update',
        'shipments.read', 'shipments.create', 'shipments.update', 'shipments.process',
        'customers.read', 'invoices.read', 'invoices.create'
      ]
    },
    // Customer Service permissions
    {
      roleSlug: 'customer_service',
      permissionSlugs: [
        'packages.read', 'packages.update',
        'shipments.read', 'shipments.update',
        'customers.read', 'customers.update',
        'invoices.read', 'invoices.create'
      ]
    },
    // Admin permissions
    {
      roleSlug: 'admin',
      permissionSlugs: [
        'packages.read', 'packages.create', 'packages.update', 'packages.delete',
        'shipments.read', 'shipments.create', 'shipments.update', 'shipments.process',
        'customers.read', 'customers.update', 'customers.manage',
        'invoices.read', 'invoices.create', 'payments.process',
        'warehouses.manage', 'reports.read'
      ]
    },
    // Super Admin - all permissions
    {
      roleSlug: 'super_admin',
      permissionSlugs: createdPermissions.map(p => p.slug)
    }
  ];

  for (const mapping of rolePermissionMappings) {
    const role = createdRoles.find(r => r.slug === mapping.roleSlug);
    if (!role) continue;

    const rolePermissionsData = mapping.permissionSlugs.map(permSlug => {
      const permission = createdPermissions.find(p => p.slug === permSlug);
      return permission ? { roleId: role.id, permissionId: permission.id } : null;
    }).filter(Boolean) as { roleId: string; permissionId: string; }[];

    if (rolePermissionsData.length > 0) {
      await db.insert(rolePermissions).values(rolePermissionsData);
    }
  }

  console.log('✅ Role permissions assigned');

  // 6. Create default warehouse
  const [defaultWarehouse] = await db.insert(warehouses).values({
    tenantId: defaultTenant.id,
    code: 'UK1',
    name: 'UK Warehouse - London',
    description: 'Primary UK receiving warehouse',
    countryCode: 'GB',
    addressLine1: 'Forward2Me UK Ltd',
    addressLine2: '123 Warehouse Street',
    city: 'London',
    postalCode: 'E14 9BB',
    phone: '+44 20 7946 0958',
    email: 'warehouse@forward2me.com',
    timezone: 'Europe/London',
    currencyCode: 'GBP',
    taxTreatment: 'standard',
    storageFreeDays: 30,
    storageFeePerDay: '1.00',
    status: 'active',
    acceptsNewPackages: true,
  }).returning();

  console.log('✅ Default warehouse created');

  // 7. Create system configurations
  const configData = [
    { tenantId: defaultTenant.id, configKey: 'platform_name', configValue: 'Package Forwarding Platform', configType: 'string', description: 'Platform display name', isPublic: true },
    { tenantId: defaultTenant.id, configKey: 'support_email', configValue: 'support@platform.com', configType: 'string', description: 'Support contact email', isPublic: true },
    { tenantId: defaultTenant.id, configKey: 'default_currency', configValue: 'USD', configType: 'string', description: 'Default system currency', isPublic: true },
    { tenantId: defaultTenant.id, configKey: 'multi_tenancy_enabled', configValue: 'false', configType: 'boolean', description: 'Enable multi-tenant features', isPublic: false },
    { tenantId: defaultTenant.id, configKey: 'customer_id_prefix', configValue: CUSTOMER_ID_PREFIX, configType: 'string', description: 'Prefix for customer IDs', isPublic: false },
    { tenantId: defaultTenant.id, configKey: 'customer_id_length', configValue: CUSTOMER_ID_LENGTH.toString(), configType: 'number', description: 'Length of customer ID number part', isPublic: false },
    { tenantId: defaultTenant.id, configKey: 'storage_free_days_default', configValue: '30', configType: 'number', description: 'Default free storage days', isPublic: false },
    { tenantId: defaultTenant.id, configKey: 'max_package_weight_kg', configValue: '30', configType: 'number', description: 'Maximum package weight in kg', isPublic: false },
    { tenantId: defaultTenant.id, configKey: 'auto_generate_suite_codes', configValue: 'true', configType: 'boolean', description: 'Auto-generate suite codes for customers', isPublic: false },
    { tenantId: defaultTenant.id, configKey: 'require_kyc_for_high_value', configValue: 'true', configType: 'boolean', description: 'Require KYC for high-value packages', isPublic: false },
    { tenantId: defaultTenant.id, configKey: 'high_value_threshold', configValue: '1000', configType: 'number', description: 'High value threshold in USD', isPublic: false },
  ];

  await db.insert(systemConfigs).values(configData);
  console.log('✅ System configurations created');

  // 8. Create admin user
  const adminPasswordHash = await hashPassword('admin123');
  const [adminUser] = await db.insert(users).values({
    tenantId: defaultTenant.id,
    email: 'admin@platform.com',
    passwordHash: adminPasswordHash,
    firstName: 'Admin',
    lastName: 'User',
    userType: 'admin',
    status: 'active',
    emailVerifiedAt: new Date(),
  }).returning();

  // Assign super admin role to admin user
  const superAdminRole = createdRoles.find(r => r.slug === 'super_admin');
  if (superAdminRole) {
    await db.insert(userRoles).values({
      userId: adminUser.id,
      roleId: superAdminRole.id,
    });
  }

  console.log('✅ Admin user created: admin@platform.com / admin123');

  // 9. Create sample customer
  const customerPasswordHash = await hashPassword('customer123');
  const [customerUser] = await db.insert(users).values({
    tenantId: defaultTenant.id,
    email: 'customer@example.com',
    passwordHash: customerPasswordHash,
    firstName: 'John',
    lastName: 'Doe',
    phone: '+971501234567',
    userType: 'customer',
    status: 'active',
    emailVerifiedAt: new Date(),
  }).returning();

  // Create customer profile with auto-generated customer ID
  function generateCustomerId(): string {
    const randomNum = Math.floor(Math.random() * Math.pow(10, CUSTOMER_ID_LENGTH))
      .toString()
      .padStart(CUSTOMER_ID_LENGTH, '0');
    return `${CUSTOMER_ID_PREFIX}-${randomNum}`;
  }

  const [customerProfile] = await db.insert(customerProfiles).values({
    userId: customerUser.id,
    tenantId: defaultTenant.id,
    customerId: generateCustomerId(),
    nationality: 'AE',
    kycStatus: 'not_required',
    riskLevel: 'low',
  }).returning();

  // Assign customer role
  const customerRole = createdRoles.find(r => r.slug === 'customer');
  if (customerRole) {
    await db.insert(userRoles).values({
      userId: customerUser.id,
      roleId: customerRole.id,
    });
  }

  // Create warehouse assignment (suite code)
  await db.insert(customerWarehouseAssignments).values({
    customerProfileId: customerProfile.id,
    warehouseId: defaultWarehouse.id,
    suiteCode: customerProfile.customerId,
    status: 'active',
    assignedBy: adminUser.id,
  });

  console.log(`✅ Sample customer created: customer@example.com / customer123`);
  console.log(`   Customer ID: ${customerProfile.customerId}`);
  console.log(`   Suite Code: ${customerProfile.customerId}`);

  // 10. Create warehouse staff user
  const warehouseStaffPasswordHash = await hashPassword('warehouse123');
  const [warehouseStaffUser] = await db.insert(users).values({
    tenantId: defaultTenant.id,
    email: 'warehouse@platform.com',
    passwordHash: warehouseStaffPasswordHash,
    firstName: 'Warehouse',
    lastName: 'Staff',
    userType: 'staff',
    status: 'active',
    emailVerifiedAt: new Date(),
  }).returning();

  // Assign warehouse staff role
  const warehouseStaffRole = createdRoles.find(r => r.slug === 'warehouse_staff');
  if (warehouseStaffRole) {
    await db.insert(userRoles).values({
      userId: warehouseStaffUser.id,
      roleId: warehouseStaffRole.id,
    });
  }

  console.log('✅ Warehouse staff user created: warehouse@platform.com / warehouse123');

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📋 Summary:');
  console.log(`   • Default tenant: ${defaultTenant.name}`);
  console.log(`   • Permissions: ${createdPermissions.length}`);
  console.log(`   • Roles: ${createdRoles.length}`);
  console.log(`   • Warehouses: 1 (UK1 - London)`);
  console.log(`   • Users: 3 (admin, customer, warehouse staff)`);
  console.log(`   • System configs: ${configData.length}`);
  console.log('\n🔐 Login Credentials:');
  console.log('   Admin: admin@platform.com / admin123');
  console.log('   Customer: customer@example.com / customer123');
  console.log('   Warehouse: warehouse@platform.com / warehouse123');
}

seed()
  .catch((error) => {
    console.error('❌ Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('🏁 Seed process finished. Exiting...');
    process.exit(0);
  });