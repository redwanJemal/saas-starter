// lib/db/seed/seed-users-roles.ts
import { db } from '../index';
import { users, roles, permissions, rolePermissions, userRoles } from '@/features/auth/db/schema';
import { logSeedProgress, logSeedSuccess, logSeedError } from './utils';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

// Define missing interfaces for auth data
interface CreatePermissionData {
  name: string;
  slug: string;
  description?: string;
  category: string; // Changed from resource to category to match schema
  action: string;
}

interface CreateRoleData {
  name: string;
  slug: string;
  description?: string;
  roleType: string;
  isSystemRole?: boolean;
  tenantId: string;
}

// Extended interface with tenantId for roles
interface ExtendedRoleData extends CreateRoleData {
  tenantId: string;
}

/**
 * Seed users, roles, and permissions
 * @param tenantIds Array of tenant IDs to associate users with
 */
export async function seedUsersAndRoles(tenantIds: string[]) {
  if (!tenantIds.length) {
    logSeedError('No tenant IDs provided for seeding users and roles');
    return { users: [], roles: [], permissions: [] };
  }

  logSeedProgress('Seeding roles and permissions...');
  
  // Create permissions
  const permissionData: CreatePermissionData[] = [
    // User management permissions
    { name: 'View Users', slug: 'view_users', description: 'Can view users', category: 'users', action: 'read' },
    { name: 'Create Users', slug: 'create_users', description: 'Can create users', category: 'users', action: 'create' },
    { name: 'Edit Users', slug: 'edit_users', description: 'Can edit users', category: 'users', action: 'update' },
    { name: 'Delete Users', slug: 'delete_users', description: 'Can delete users', category: 'users', action: 'delete' },
    
    // Warehouse permissions
    { name: 'View Warehouses', slug: 'view_warehouses', description: 'Can view warehouses', category: 'warehouses', action: 'read' },
    { name: 'Create Warehouses', slug: 'create_warehouses', description: 'Can create warehouses', category: 'warehouses', action: 'create' },
    { name: 'Edit Warehouses', slug: 'edit_warehouses', description: 'Can edit warehouses', category: 'warehouses', action: 'update' },
    { name: 'Delete Warehouses', slug: 'delete_warehouses', description: 'Can delete warehouses', category: 'warehouses', action: 'delete' },
    
    // Settings permissions
    { name: 'View Settings', slug: 'view_settings', description: 'Can view settings', category: 'settings', action: 'read' },
    { name: 'Edit Settings', slug: 'edit_settings', description: 'Can edit settings', category: 'settings', action: 'update' },
    
    // Country settings permissions
    { name: 'View Countries', slug: 'view_countries', description: 'Can view countries', category: 'countries', action: 'read' },
    { name: 'Create Countries', slug: 'create_countries', description: 'Can create countries', category: 'countries', action: 'create' },
    { name: 'Edit Countries', slug: 'edit_countries', description: 'Can edit countries', category: 'countries', action: 'update' },
    { name: 'Delete Countries', slug: 'delete_countries', description: 'Can delete countries', category: 'countries', action: 'delete' },
    
    // Courier settings permissions
    { name: 'View Couriers', slug: 'view_couriers', description: 'Can view couriers', category: 'couriers', action: 'read' },
    { name: 'Create Couriers', slug: 'create_couriers', description: 'Can create couriers', category: 'couriers', action: 'create' },
    { name: 'Edit Couriers', slug: 'edit_couriers', description: 'Can edit couriers', category: 'couriers', action: 'update' },
    { name: 'Delete Couriers', slug: 'delete_couriers', description: 'Can delete couriers', category: 'couriers', action: 'delete' },
    
    // Currency settings permissions
    { name: 'View Currencies', slug: 'view_currencies', description: 'Can view currencies', category: 'currencies', action: 'read' },
    { name: 'Create Currencies', slug: 'create_currencies', description: 'Can create currencies', category: 'currencies', action: 'create' },
    { name: 'Edit Currencies', slug: 'edit_currencies', description: 'Can edit currencies', category: 'currencies', action: 'update' },
    { name: 'Delete Currencies', slug: 'delete_currencies', description: 'Can delete currencies', category: 'currencies', action: 'delete' },
  ];

  const insertedPermissions = await db.insert(permissions).values(permissionData).returning();
  logSeedSuccess(`Created ${insertedPermissions.length} permissions`);

  // Create roles for each tenant
  const rolesByTenant: Record<string, any[]> = {};
  
  for (const tenantId of tenantIds) {
    logSeedProgress(`Creating roles for tenant ${tenantId}...`);
    
    const roleData: CreateRoleData[] = [
      {
        tenantId,
        name: 'Admin',
        slug: 'admin',
        description: 'Full system access',
        roleType: 'admin',
        isSystemRole: true
      },
      {
        tenantId,
        name: 'Staff',
        slug: 'staff',
        description: 'Limited access to manage operations',
        roleType: 'staff',
        isSystemRole: true
      },
      {
        tenantId,
        name: 'Customer',
        slug: 'customer',
        description: 'Basic customer access',
        roleType: 'customer',
        isSystemRole: true
      }
    ];
    
    const insertedRoles = await db.insert(roles).values(roleData).returning();
    rolesByTenant[tenantId] = insertedRoles;
    logSeedSuccess(`Created ${insertedRoles.length} roles for tenant ${tenantId}`);
    
    // Assign permissions to roles
    const rolePermissionValues = [];
    
    // Admin role gets all permissions
    const adminRole = insertedRoles.find(role => role.slug === 'admin');
    if (adminRole) {
      for (const permission of insertedPermissions) {
        rolePermissionValues.push({
          roleId: adminRole.id,
          permissionId: permission.id
        });
      }
    }
    
    // Staff role gets view permissions and some edit permissions
    const staffRole = insertedRoles.find(role => role.slug === 'staff');
    if (staffRole) {
      const staffPermissions = insertedPermissions.filter(p => 
        p.slug.startsWith('view_') || 
        ['edit_settings', 'edit_countries', 'edit_couriers', 'edit_currencies'].includes(p.slug)
      );
      
      for (const permission of staffPermissions) {
        rolePermissionValues.push({
          roleId: staffRole.id,
          permissionId: permission.id
        });
      }
    }
    
    // Customer role gets minimal permissions
    const customerRole = insertedRoles.find(role => role.slug === 'customer');
    if (customerRole) {
      const customerPermissions = insertedPermissions.filter(p => 
        ['view_warehouses'].includes(p.slug)
      );
      
      for (const permission of customerPermissions) {
        rolePermissionValues.push({
          roleId: customerRole.id,
          permissionId: permission.id
        });
      }
    }
    
    if (rolePermissionValues.length) {
      await db.insert(rolePermissions).values(rolePermissionValues);
      logSeedSuccess(`Assigned permissions to roles for tenant ${tenantId}`);
    }
  }

  // Create users for each tenant
  logSeedProgress('Seeding users...');
  const allUsers = [];
  const userRoleValues = [];
  
  for (const tenantId of tenantIds) {
    const tenantRoles = rolesByTenant[tenantId] || [];
    const adminRole = tenantRoles.find(role => role.slug === 'admin');
    const staffRole = tenantRoles.find(role => role.slug === 'staff');
    const customerRole = tenantRoles.find(role => role.slug === 'customer');
    
    // Create admin user
    if (adminRole) {
      const adminUser = {
        id: uuidv4(),
        tenantId,
        email: `admin@tenant-${tenantId.substring(0, 8)}.com`,
        passwordHash: await bcrypt.hash('Admin123!', 10),
        firstName: 'Admin',
        lastName: 'User',
        userType: 'admin' as const,
        status: 'active' as const,
        language: 'en',
        timezone: 'UTC',
        currencyPreference: 'USD'
      };
      
      allUsers.push(adminUser);
      
      userRoleValues.push({
        userId: adminUser.id,
        roleId: adminRole.id
      });
    }
    
    // Create staff user
    if (staffRole) {
      const staffUser = {
        id: uuidv4(),
        tenantId,
        email: `staff@tenant-${tenantId.substring(0, 8)}.com`,
        passwordHash: await bcrypt.hash('Staff123!', 10),
        firstName: 'Staff',
        lastName: 'User',
        userType: 'staff' as const,
        status: 'active' as const,
        language: 'en',
        timezone: 'UTC',
        currencyPreference: 'USD'
      };
      
      allUsers.push(staffUser);
      
      userRoleValues.push({
        userId: staffUser.id,
        roleId: staffRole.id
      });
    }
    
    // Create customer user
    if (customerRole) {
      const customerUser = {
        id: uuidv4(),
        tenantId,
        email: `customer@tenant-${tenantId.substring(0, 8)}.com`,
        passwordHash: await bcrypt.hash('Customer123!', 10),
        firstName: 'Customer',
        lastName: 'User',
        userType: 'customer' as const,
        status: 'active' as const,
        language: 'en',
        timezone: 'UTC',
        currencyPreference: 'USD'
      };
      
      allUsers.push(customerUser);
      
      userRoleValues.push({
        userId: customerUser.id,
        roleId: customerRole.id
      });
    }
  }
  
  const insertedUsers = await db.insert(users).values(allUsers).returning();
  logSeedSuccess(`Created ${insertedUsers.length} users`);
  
  if (userRoleValues.length) {
    await db.insert(userRoles).values(userRoleValues);
    logSeedSuccess(`Assigned roles to users`);
  }
  
  return {
    users: insertedUsers,
    roles: Object.values(rolesByTenant).flat(),
    permissions: insertedPermissions
  };
}
