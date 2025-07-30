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
  
  settings: {
    countries: {
      all: ['countries'] as const,
      lists: () => [...queryKeys.settings.countries.all, 'list'] as const,
      list: (filters: any) => [...queryKeys.settings.countries.lists(), { filters }] as const,
      details: () => [...queryKeys.settings.countries.all, 'detail'] as const,
      detail: (id: string) => [...queryKeys.settings.countries.details(), id] as const,
      stats: () => [...queryKeys.settings.countries.all, 'stats'] as const,
    },
    currencies: {
      all: ['currencies'] as const,
      lists: () => [...queryKeys.settings.currencies.all, 'list'] as const,
      list: (filters: any) => [...queryKeys.settings.currencies.lists(), { filters }] as const,
      details: () => [...queryKeys.settings.currencies.all, 'detail'] as const,
      detail: (id: string) => [...queryKeys.settings.currencies.details(), id] as const,
      stats: () => [...queryKeys.settings.currencies.all, 'stats'] as const,
    },
    couriers: {
      all: ['couriers'] as const,
      lists: () => [...queryKeys.settings.couriers.all, 'list'] as const,
      list: (filters: any) => [...queryKeys.settings.couriers.lists(), { filters }] as const,
      details: () => [...queryKeys.settings.couriers.all, 'detail'] as const,
      detail: (id: string) => [...queryKeys.settings.couriers.details(), id] as const,
      stats: () => [...queryKeys.settings.couriers.all, 'stats'] as const,
    },
    tenantCurrencies: {
      all: ['tenantCurrencies'] as const,
      lists: () => [...queryKeys.settings.tenantCurrencies.all, 'list'] as const,
      list: (filters: any) => [...queryKeys.settings.tenantCurrencies.lists(), { filters }] as const,
      details: () => [...queryKeys.settings.tenantCurrencies.all, 'detail'] as const,
      detail: (id: string) => [...queryKeys.settings.tenantCurrencies.details(), id] as const,
      stats: () => [...queryKeys.settings.tenantCurrencies.all, 'stats'] as const,
    },
    tenantCouriers: {
      all: ['tenantCouriers'] as const,
      lists: () => [...queryKeys.settings.tenantCouriers.all, 'list'] as const,
      list: (filters: any) => [...queryKeys.settings.tenantCouriers.lists(), { filters }] as const,
      details: () => [...queryKeys.settings.tenantCouriers.all, 'detail'] as const,
      detail: (id: string) => [...queryKeys.settings.tenantCouriers.details(), id] as const,
      stats: () => [...queryKeys.settings.tenantCouriers.all, 'stats'] as const,
    },
    customerCurrencies: {
      all: ['customerCurrencies'] as const,
      lists: () => [...queryKeys.settings.customerCurrencies.all, 'list'] as const,
      list: (filters: any) => [...queryKeys.settings.customerCurrencies.lists(), { filters }] as const,
      details: () => [...queryKeys.settings.customerCurrencies.all, 'detail'] as const,
      detail: (id: string) => [...queryKeys.settings.customerCurrencies.details(), id] as const,
      stats: () => [...queryKeys.settings.customerCurrencies.all, 'stats'] as const,
    },
    customerCouriers: {
      all: ['customerCouriers'] as const,
      lists: () => [...queryKeys.settings.customerCouriers.all, 'list'] as const,
      list: (filters: any) => [...queryKeys.settings.customerCouriers.lists(), { filters }] as const,
      details: () => [...queryKeys.settings.customerCouriers.all, 'detail'] as const,
      detail: (id: string) => [...queryKeys.settings.customerCouriers.details(), id] as const,
      stats: () => [...queryKeys.settings.customerCouriers.all, 'stats'] as const,
    },
    customerCountries: {
      all: ['customerCountries'] as const,
      lists: () => [...queryKeys.settings.customerCountries.all, 'list'] as const,
      list: (filters: any) => [...queryKeys.settings.customerCountries.lists(), { filters }] as const,
      details: () => [...queryKeys.settings.customerCountries.all, 'detail'] as const,
      detail: (id: string) => [...queryKeys.settings.customerCountries.details(), id] as const,
      stats: () => [...queryKeys.settings.customerCountries.all, 'stats'] as const,
    },
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
