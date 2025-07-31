// features/packages/hooks/use-packages.hook.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { packageApiService } from '@/features/packages/services/package-api.service';
import type {
  PackageFilters,
  CreatePackageData,
  UpdatePackageData,
  BulkPackageAction,
  BulkStatusUpdate,
  IncomingShipmentFilters,
  CreateIncomingShipmentData,
} from '@/features/packages/types/package.types';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const packageQueryKeys = {
  all: ['packages'] as const,
  lists: () => [...packageQueryKeys.all, 'list'] as const,
  list: (filters: PackageFilters) => [...packageQueryKeys.lists(), filters] as const,
  details: () => [...packageQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...packageQueryKeys.details(), id] as const,
  statistics: () => [...packageQueryKeys.all, 'statistics'] as const,
  expected: (filters: Omit<PackageFilters, 'status'>) => [...packageQueryKeys.all, 'expected', filters] as const,
  received: (filters: Omit<PackageFilters, 'status'>) => [...packageQueryKeys.all, 'received', filters] as const,
  readyToShip: (filters: Omit<PackageFilters, 'status'>) => [...packageQueryKeys.all, 'ready-to-ship', filters] as const,
  byCustomer: (customerId: string, filters: Omit<PackageFilters, 'customerId'>) => 
    [...packageQueryKeys.all, 'customer', customerId, filters] as const,
  byWarehouse: (warehouseId: string, filters: Omit<PackageFilters, 'warehouseId'>) => 
    [...packageQueryKeys.all, 'warehouse', warehouseId, filters] as const,
  documents: (packageId: string) => [...packageQueryKeys.all, 'documents', packageId] as const,
  incomingShipmentsList: (filters: IncomingShipmentFilters) => [...packageQueryKeys.all, 'incoming-shipments', filters] as const,
  incomingShipmentDetail: (id: string) => [...packageQueryKeys.all, 'incoming-shipment', id] as const,
  search: (query: string, filters?: any) => [...packageQueryKeys.all, 'search', query, filters] as const,
};

// ============================================================================
// PACKAGE QUERIES
// ============================================================================

/**
 * Hook to get all packages with filtering and pagination
 */
export function usePackages(filters: PackageFilters = {}) {
  return useQuery({
    queryKey: packageQueryKeys.list(filters),
    queryFn: () => packageApiService.getPackages(filters),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get a specific package by ID
 */
export function usePackage(id: string) {
  return useQuery({
    queryKey: packageQueryKeys.detail(id),
    queryFn: () => packageApiService.getPackage(id),
    enabled: !!id,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to get incoming shipment items
 */
export function useIncomingShipmentItems(filters: {
    assignmentStatus?: 'assigned' | 'unassigned' | 'all';
    search?: string;
    page?: number;
    limit?: number;
  } = {}) {
    return useQuery({
      queryKey: ['incomingShipmentItems', filters],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (filters.assignmentStatus) params.append('assignmentStatus', filters.assignmentStatus);
        if (filters.search) params.append('search', filters.search);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());
  
        const response = await fetch(`/api/admin/incoming-shipment-items?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch incoming shipment items');
        }
        return response.json();
      },
      staleTime: 30 * 1000,
    });
  }
  
  /**
   * Hook to assign items to customers
   */
  export function useAssignItems() {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: async ({ assignments }: { 
        assignments: Array<{ 
          itemId: string; 
          customerProfileId: string; 
        }> 
      }) => {
        const response = await fetch('/api/admin/assign-packages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ assignments }),
        });
  
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to assign items');
        }
  
        return response.json();
      },
      onSuccess: () => {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['incomingShipmentItems'] });
        queryClient.invalidateQueries({ queryKey: ['packages'] });
        toast.success('Items assigned successfully');
      },
      onError: (error: any) => {
        toast.error(error?.message || 'Failed to assign items');
      },
    });
  }
  
  /**
   * Function to assign incoming shipment items (used in API routes)
   */
  export async function assignIncomingShipmentItems(assignments: Array<{
    itemId: string;
    customerProfileId: string;
    assignedBy: string;
  }>) {
    // This would typically be imported from a database queries file
    // For now, return a mock structure that matches the expected response
    return {
      assignedItems: assignments.map(assignment => ({
        id: assignment.itemId,
        assignedCustomerProfileId: assignment.customerProfileId,
        trackingNumber: `TRK${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        assignedAt: new Date().toISOString(),
        assignedBy: assignment.assignedBy,
      })),
      failed: [],
    };
  }
/**
 * Hook to get package statistics
 */
export function usePackageStatistics() {
  return useQuery({
    queryKey: packageQueryKeys.statistics(),
    queryFn: () => packageApiService.getPackageStatistics(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

/**
 * Hook to get expected packages
 */
export function useExpectedPackages(filters: Omit<PackageFilters, 'status'> = {}) {
  return useQuery({
    queryKey: packageQueryKeys.expected(filters),
    queryFn: () => packageApiService.getExpectedPackages(filters),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to get received packages
 */
export function useReceivedPackages(filters: Omit<PackageFilters, 'status'> = {}) {
  return useQuery({
    queryKey: packageQueryKeys.received(filters),
    queryFn: () => packageApiService.getReceivedPackages(filters),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to get ready to ship packages
 */
export function useReadyToShipPackages(filters: Omit<PackageFilters, 'status'> = {}) {
  return useQuery({
    queryKey: packageQueryKeys.readyToShip(filters),
    queryFn: () => packageApiService.getReadyToShipPackages(filters),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to get packages by customer
 */
export function usePackagesByCustomer(
  customerId: string, 
  filters: Omit<PackageFilters, 'customerId'> = {}
) {
  return useQuery({
    queryKey: packageQueryKeys.byCustomer(customerId, filters),
    queryFn: () => packageApiService.getPackagesByCustomer(customerId, filters),
    enabled: !!customerId,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to get packages by warehouse
 */
export function usePackagesByWarehouse(
  warehouseId: string, 
  filters: Omit<PackageFilters, 'warehouseId'> = {}
) {
  return useQuery({
    queryKey: packageQueryKeys.byWarehouse(warehouseId, filters),
    queryFn: () => packageApiService.getPackagesByWarehouse(warehouseId, filters),
    enabled: !!warehouseId,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to get package documents
 */
export function usePackageDocuments(packageId: string) {
  return useQuery({
    queryKey: packageQueryKeys.documents(packageId),
    queryFn: () => packageApiService.getPackageDocuments(packageId),
    enabled: !!packageId,
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to search packages
 */
export function useSearchPackages(query: string, filters?: {
  status?: string;
  warehouseId?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: packageQueryKeys.search(query, filters),
    queryFn: () => packageApiService.searchPackages(query, filters),
    enabled: query.length >= 2, // Only search if query is at least 2 characters
    staleTime: 30 * 1000,
  });
}

// ============================================================================
// PACKAGE MUTATIONS
// ============================================================================

  
  /**
   * Hook to create a package
   */
  export function useCreatePackage() {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: async (packageData: any) => {
        const response = await fetch('/api/admin/packages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(packageData),
        });
  
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to create package');
        }
  
        return response.json();
      },
      onSuccess: () => {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['packages'] });
        queryClient.invalidateQueries({ queryKey: ['incomingShipmentItems'] });
        toast.success('Package created successfully');
      },
      onError: (error: any) => {
        toast.error(error?.message || 'Failed to create package');
      },
    });
  }

/**
 * Hook to update a package
 */
export function useUpdatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePackageData }) => 
      packageApiService.updatePackage(id, data),
    onSuccess: (response, { id }) => {
      queryClient.setQueryData(packageQueryKeys.detail(id), response);
      queryClient.invalidateQueries({ queryKey: packageQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: packageQueryKeys.statistics() });
      
      toast.success('Package marked as ready to ship');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to mark package as ready to ship');
    },
  });
}

/**
 * Hook to mark package as shipped
 */
export function useMarkPackageShipped() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { 
      id: string; 
      data: {
        trackingNumberOutbound: string;
        shippedAt?: string;
        notes?: string;
      }
    }) => packageApiService.markPackageShipped(id, data),
    onSuccess: (response, { id }) => {
      queryClient.setQueryData(packageQueryKeys.detail(id), response);
      queryClient.invalidateQueries({ queryKey: packageQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: packageQueryKeys.statistics() });
      
      toast.success('Package marked as shipped');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to mark package as shipped');
    },
  });
}

// ============================================================================
// DOCUMENT MANAGEMENT MUTATIONS
// ============================================================================

/**
 * Hook to attach a document to a package
 */
export function useAttachDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ packageId, data }: { 
      packageId: string; 
      data: import('@/features/packages/types/package.types').AttachDocumentData 
    }) => packageApiService.attachDocument(packageId, data),
    onSuccess: (_, { packageId }) => {
      queryClient.invalidateQueries({ queryKey: packageQueryKeys.documents(packageId) });
      queryClient.invalidateQueries({ queryKey: packageQueryKeys.detail(packageId) });
      
      toast.success('Document attached successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to attach document');
    },
  });
}

/**
 * Hook to detach a document from a package
 */
export function useDetachDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ packageId, documentId }: { packageId: string; documentId: string }) => 
      packageApiService.detachDocument(packageId, documentId),
    onSuccess: (_, { packageId }) => {
      queryClient.invalidateQueries({ queryKey: packageQueryKeys.documents(packageId) });
      queryClient.invalidateQueries({ queryKey: packageQueryKeys.detail(packageId) });
      
      toast.success('Document detached successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to detach document');
    },
  });
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook to prefetch a package
 */
export function usePrefetchPackage() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: packageQueryKeys.detail(id),
      queryFn: () => packageApiService.getPackage(id),
      staleTime: 60 * 1000,
    });
  };
}

/**
 * Hook to invalidate package queries
 */
export function useInvalidatePackages() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: packageQueryKeys.all }),
    invalidateLists: () => queryClient.invalidateQueries({ queryKey: packageQueryKeys.lists() }),
    invalidateStatistics: () => queryClient.invalidateQueries({ queryKey: packageQueryKeys.statistics() }),
    invalidatePackage: (id: string) => queryClient.invalidateQueries({ queryKey: packageQueryKeys.detail(id) }),
    invalidateCustomerPackages: (customerId: string) => 
      queryClient.invalidateQueries({ queryKey: ['packages', 'customer', customerId] }),
    invalidateWarehousePackages: (warehouseId: string) => 
      queryClient.invalidateQueries({ queryKey: ['packages', 'warehouse', warehouseId] }),
  };
}

/**
 * Hook to delete a package
 */
export function useDeletePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => packageApiService.deletePackage(id),
    onSuccess: (_, id) => {
      // Remove the package from cache
      queryClient.removeQueries({ queryKey: packageQueryKeys.detail(id) });
      
      // Invalidate package lists
      queryClient.invalidateQueries({ queryKey: packageQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: packageQueryKeys.statistics() });
      
      toast.success('Package deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete package');
    },
  });
}

/**
 * Hook to bulk update packages
 */
export function useBulkUpdatePackages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (action: BulkPackageAction) => packageApiService.bulkUpdatePackages(action),
    onSuccess: (response) => {
      // Invalidate all package queries
      queryClient.invalidateQueries({ queryKey: packageQueryKeys.all });
      
      toast.success(
        `Successfully updated ${response.data.updated} packages${
          response.data.failed.length > 0 
            ? `, ${response.data.failed.length} failed` 
            : ''
        }`
      );
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to bulk update packages');
    },
  });
}

/**
 * Hook to bulk update package statuses
 */
export function useBulkUpdateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: BulkStatusUpdate) => packageApiService.bulkUpdateStatus(updates),
    onSuccess: (response) => {
      // Invalidate all package queries
      queryClient.invalidateQueries({ queryKey: packageQueryKeys.all });
      
      toast.success(
        `Successfully updated ${response.data.updated} package statuses${
          response.data.failed.length > 0 
            ? `, ${response.data.failed.length} failed` 
            : ''
        }`
      );
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to bulk update statuses');
    },
  });
}

// ============================================================================
// PACKAGE STATUS MUTATIONS
// ============================================================================

/**
 * Hook to update package status
 */
export function useUpdatePackageStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      id, 
      status, 
      reason, 
      notes 
    }: { 
      id: string; 
      status: string; 
      reason?: string; 
      notes?: string; 
    }) => packageApiService.updatePackageStatus(id, status, reason, notes),
    onSuccess: (response, { id }) => {
      // Update the specific package in cache
      queryClient.setQueryData(packageQueryKeys.detail(id), response);
      
      // Invalidate package lists
      queryClient.invalidateQueries({ queryKey: packageQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: packageQueryKeys.statistics() });
      
      toast.success('Package status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update package status');
    },
  });
}

/**
 * Hook to mark package as received
 */
export function useMarkPackageReceived() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { 
      id: string; 
      data: {
        receivedAt?: string;
        warehouseNotes?: string;
        actualWeight?: number;
        actualDimensions?: {
          lengthCm: number;
          widthCm: number;
          heightCm: number;
        };
      }
    }) => packageApiService.markPackageReceived(id, data),
    onSuccess: (response, { id }) => {
      queryClient.setQueryData(packageQueryKeys.detail(id), response);
      queryClient.invalidateQueries({ queryKey: packageQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: packageQueryKeys.statistics() });
      
      toast.success('Package marked as received');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to mark package as received');
    },
  });
}

export function useIncomingShipments(filters: IncomingShipmentFilters = {}) {
    return useQuery({
      queryKey: packageQueryKeys.incomingShipmentsList(filters),
      queryFn: () => packageApiService.getIncomingShipments(filters),
      staleTime: 30 * 1000,
    });
  }
  
  export function useIncomingShipment(id: string) {
    return useQuery({
      queryKey: packageQueryKeys.incomingShipmentDetail(id),
      queryFn: () => packageApiService.getIncomingShipment(id),
      enabled: !!id,
      staleTime: 60 * 1000,
    });
  }

/**
 * Hook to create an incoming shipment
 */
export function useCreateIncomingShipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateIncomingShipmentData) => 
      packageApiService.createIncomingShipment(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: packageQueryKeys.all });
      toast.success('Incoming shipment created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create incoming shipment');
    },
  });
}

/**
 * Hook to mark package as ready to ship
 */
export function useMarkPackageReadyToShip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => 
      packageApiService.markPackageReadyToShip(id, notes),
    onSuccess: (response, { id }) => {
      queryClient.setQueryData(packageQueryKeys.detail(id), response);
      queryClient.invalidateQueries({ queryKey: packageQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: packageQueryKeys.statistics() });
      
      toast.success('Package marked as ready to ship');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to mark package as ready to ship');
    },
  });
}