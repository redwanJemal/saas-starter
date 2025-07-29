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

  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    stats: (userId?: string) => [...queryKeys.dashboard.all, 'stats', userId] as const,
    activity: () => [...queryKeys.dashboard.all, 'activity'] as const,
  },
} as const;
