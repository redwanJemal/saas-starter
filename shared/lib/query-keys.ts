export const queryKeys = {
  // Packages
  packages: {
    all: ['packages'] as const,
    lists: () => [...queryKeys.packages.all, 'list'] as const,
    list: (filters: any) => [...queryKeys.packages.lists(), { filters }] as const,
    details: () => [...queryKeys.packages.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.packages.details(), id] as const,
    stats: () => [...queryKeys.packages.all, 'stats'] as const,
  },
  
  // Customers
  customers: {
    all: ['customers'] as const,
    lists: () => [...queryKeys.customers.all, 'list'] as const,
    list: (filters: any) => [...queryKeys.customers.lists(), { filters }] as const,
    details: () => [...queryKeys.customers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.customers.details(), id] as const,
    search: (query: string) => [...queryKeys.customers.all, 'search', query] as const,
  },

  // Warehouses
  warehouses: {
    all: ['warehouses'] as const,
    lists: () => [...queryKeys.warehouses.all, 'list'] as const,
    list: (filters: any) => [...queryKeys.warehouses.lists(), { filters }] as const,
    details: () => [...queryKeys.warehouses.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.warehouses.details(), id] as const,
    statistics: () => [...queryKeys.warehouses.all, 'statistics'] as const,
    capacity: (id: string) => [...queryKeys.warehouses.all, 'capacity', id] as const,
    
    // Bin Locations
    binLocations: {
      all: ['binLocations'] as const,
      lists: () => [...queryKeys.warehouses.binLocations.all, 'list'] as const,
      list: (filters: any) => [...queryKeys.warehouses.binLocations.lists(), { filters }] as const,
      details: () => [...queryKeys.warehouses.binLocations.all, 'detail'] as const,
      detail: (id: string) => [...queryKeys.warehouses.binLocations.details(), id] as const,
    },
    
    // Customer Warehouse Assignments
    assignments: {
      all: ['assignments'] as const,
      lists: () => [...queryKeys.warehouses.assignments.all, 'list'] as const,
      list: (filters: any) => [...queryKeys.warehouses.assignments.lists(), { filters }] as const,
      details: () => [...queryKeys.warehouses.assignments.all, 'detail'] as const,
      detail: (id: string) => [...queryKeys.warehouses.assignments.details(), id] as const,
    },
    
    // Storage Pricing
    storagePricing: {
      all: ['storagePricing'] as const,
      lists: () => [...queryKeys.warehouses.storagePricing.all, 'list'] as const,
      list: (filters: any) => [...queryKeys.warehouses.storagePricing.lists(), { filters }] as const,
      details: () => [...queryKeys.warehouses.storagePricing.all, 'detail'] as const,
      detail: (id: string) => [...queryKeys.warehouses.storagePricing.details(), id] as const,
    },
  },

  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    stats: (userId?: string) => [...queryKeys.dashboard.all, 'stats', userId] as const,
    activity: () => [...queryKeys.dashboard.all, 'activity'] as const,
  },
} as const;
