import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-keys';
import { packageApi } from '../services/package-api';
import { PackageFilters, UpdatePackageData } from '../types/package.types';
import { useGlobalStore } from '@/shared/stores/global-store';

// Queries
export const usePackages = (filters: PackageFilters = {}) => {
  return useQuery({ 
    queryKey: queryKeys.packages.list(filters),
    queryFn: () => packageApi.getPackages(filters),
    select: (data) => data, // Return full response with data and pagination
  });
};

export const usePackage = (id: string) => {
  return useQuery({
    queryKey: queryKeys.packages.detail(id),
    queryFn: () => packageApi.getPackage(id),
    select: (data) => data.data,
    enabled: !!id,
  });
};

export const usePackageSearch = (query: string) => {
  return useQuery({
    queryKey: [...queryKeys.packages.all, 'search', query],
    queryFn: () => packageApi.searchPackages(query),
    select: (data) => data.data,
    enabled: query.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Mutations
export const useCreatePackage = () => {
  const queryClient = useQueryClient();
  const addNotification = useGlobalStore(state => state.addNotification);

  return useMutation({
    mutationFn: packageApi.createPackage,
    onSuccess: (response) => {
      // Invalidate and refetch packages list
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.packages.lists() 
      });
      
      addNotification({
        type: 'success',
        message: 'Package created successfully',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to create package',
      });
    },
  });
};

export const useUpdatePackage = () => {
  const queryClient = useQueryClient();
  const addNotification = useGlobalStore(state => state.addNotification);

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePackageData }) =>
      packageApi.updatePackage(id, data),
    
    // Optimistic update
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.packages.detail(id) });
      
      const previousPackage = queryClient.getQueryData(queryKeys.packages.detail(id));
      
      queryClient.setQueryData(queryKeys.packages.detail(id), (old: any) => ({
        ...old,
        data: { ...old?.data, ...data }
      }));

      return { previousPackage };
    },

    onError: (err, variables, context) => {
      if (context?.previousPackage) {
        queryClient.setQueryData(
          queryKeys.packages.detail(variables.id),
          context.previousPackage
        );
      }
      
      addNotification({
        type: 'error',
        message: 'Failed to update package',
      });
    },

    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.packages.lists() });
      
      addNotification({
        type: 'success',
        message: 'Package updated successfully',
      });
    },
  });
};

export const useUpdatePackageStatus = () => {
  const queryClient = useQueryClient();
  const addNotification = useGlobalStore(state => state.addNotification);

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      packageApi.updateStatus(id, status),
      
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.packages.detail(id) });
      
      const previousPackage = queryClient.getQueryData(queryKeys.packages.detail(id));
      
      queryClient.setQueryData(queryKeys.packages.detail(id), (old: any) => ({
        ...old,
        data: { ...old?.data, status }
      }));

      return { previousPackage };
    },

    onError: (err, variables, context) => {
      if (context?.previousPackage) {
        queryClient.setQueryData(
          queryKeys.packages.detail(variables.id),
          context.previousPackage
        );
      }
    },

    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.packages.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.packages.lists() });
    },
  });
};

export const useBulkUpdatePackageStatus = () => {
  const queryClient = useQueryClient();
  const addNotification = useGlobalStore(state => state.addNotification);
  const clearSelection = useGlobalStore(state => state.clearSelection);

  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: string }) =>
      packageApi.bulkUpdateStatus(ids, status),
      
    onSuccess: (response, { ids }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.packages.lists() });
      
      // Clear selection after successful bulk update
      clearSelection('packages');
      
      addNotification({
        type: 'success',
        message: `Updated ${ids.length} packages successfully`,
      });
    },

    onError: () => {
      addNotification({
        type: 'error',
        message: 'Failed to update packages',
      });
    },
  });
};
