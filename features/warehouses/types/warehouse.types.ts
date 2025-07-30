// features/warehouses/types/warehouse.types.ts

export interface Warehouse {
    id: string;
    tenantId: string;
    code: string;
    name: string;
    description?: string;
    countryCode: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    stateProvince?: string;
    postalCode: string;
    phone?: string;
    email?: string;
    timezone: string;
    currencyCode: string;
    taxTreatment: 'standard' | 'tax_free' | 'bonded';
    storageFreeDays: number;
    storageFeePerDay: string;
    maxPackageWeightKg: string;
    maxPackageValue: string;
    status: 'active' | 'inactive' | 'maintenance';
    acceptsNewPackages: boolean;
    operatingHours: Record<string, any>;
    packageCount: number; // Computed field
    createdAt: string;
    updatedAt: string;
    // Optional stats for list view
    stats?: {
      totalPackages: number;
      pendingPackages: number;
      readyPackages: number;
      totalShipments: number;
      activeShipments: number;
    };
  }
  
  export interface WarehouseFilters {
    status?: 'active' | 'inactive' | 'maintenance';
    search?: string;
    countryCode?: string;
    acceptsNewPackages?: boolean;
    page?: number;
    limit?: number;
  }
  
  export interface CreateWarehouseData {
    code: string;
    name: string;
    description?: string;
    countryCode: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    stateProvince?: string;
    postalCode: string;
    phone?: string;
    email?: string;
    timezone: string;
    currencyCode: string;
    taxTreatment?: 'standard' | 'tax_free' | 'bonded';
    storageFreeDays?: number;
    storageFeePerDay?: string;
    maxPackageWeightKg?: string;
    maxPackageValue?: string;
    status?: 'active' | 'inactive' | 'maintenance';
    acceptsNewPackages?: boolean;
    operatingHours?: Record<string, any>;
  }
  
  export interface UpdateWarehouseData {
    code?: string;
    name?: string;
    description?: string;
    countryCode?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    stateProvince?: string;
    postalCode?: string;
    phone?: string;
    email?: string;
    timezone?: string;
    currencyCode?: string;
    taxTreatment?: 'standard' | 'tax_free' | 'bonded';
    storageFreeDays?: number;
    storageFeePerDay?: string;
    maxPackageWeightKg?: string;
    maxPackageValue?: string;
    status?: 'active' | 'inactive' | 'maintenance';
    acceptsNewPackages?: boolean;
    operatingHours?: Record<string, any>;
  }
  
  // Bin Location Types
  export interface BinLocation {
    id: string;
    warehouseId: string;
    binCode: string;
    zoneName: string;
    description?: string;
    maxCapacity: number;
    currentCapacity: number;
    maxWeightKg: string;
    dailyPremium: string;
    currency: string;
    isClimateControlled: boolean;
    isSecured: boolean;
    isAccessible: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface BinLocationFilters {
    warehouseId?: string;
    zoneName?: string;
    isActive?: boolean;
    isAvailable?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }
  
  export interface CreateBinLocationData {
    warehouseId: string;
    binCode: string;
    zoneName: string;
    description?: string;
    maxCapacity: number;
    maxWeightKg?: string;
    dailyPremium?: string;
    currency?: string;
    isClimateControlled?: boolean;
    isSecured?: boolean;
    isAccessible?: boolean;
    isActive?: boolean;
  }
  
  export interface UpdateBinLocationData {
    binCode?: string;
    zoneName?: string;
    description?: string;
    maxCapacity?: number;
    maxWeightKg?: string;
    dailyPremium?: string;
    currency?: string;
    isClimateControlled?: boolean;
    isSecured?: boolean;
    isAccessible?: boolean;
    isActive?: boolean;
  }
  
  // Warehouse Statistics
  export interface WarehouseStatistics {
    id: string;
    name: string;
    code: string;
    status: string;
    totalBinLocations: number;
    occupiedBinLocations: number;
    availableBinLocations: number;
    capacityUtilizationPercent: number;
    totalPackages: number;
    pendingPackages: number;
    readyPackages: number;
    totalValue: string;
    currency: string;
    recentActivity: number;
  }
  
  export interface AggregateWarehouseStats {
    totalWarehouses: number;
    activeWarehouses: number;
    totalCapacity: number;
    occupiedCapacity: number;
    averageUtilization: number;
  }
  
  // Customer Warehouse Assignment Types
  export interface CustomerWarehouseAssignment {
    id: string;
    customerProfileId: string;
    warehouseId: string;
    suiteCode: string;
    status: 'active' | 'suspended' | 'expired';
    assignedAt: string;
    expiresAt?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    // Relations
    warehouse?: {
      name: string;
      code: string;
      city: string;
      countryCode: string;
    };
    customer?: {
      name: string;
      email: string;
    };
  }
  
  export interface CustomerWarehouseAssignmentFilters {
    warehouseId?: string;
    customerId?: string;
    status?: 'active' | 'suspended' | 'expired';
    search?: string;
    page?: number;
    limit?: number;
  }
  
  export interface CreateCustomerWarehouseAssignmentData {
    customerProfileId: string;
    warehouseId: string;
    suiteCode: string;
    status?: 'active' | 'suspended' | 'expired';
    assignedAt?: string;
    expiresAt?: string;
    notes?: string;
  }
  
  export interface UpdateCustomerWarehouseAssignmentData {
    status?: 'active' | 'suspended' | 'expired';
    assignedAt?: string;
    expiresAt?: string;
    notes?: string;
  }