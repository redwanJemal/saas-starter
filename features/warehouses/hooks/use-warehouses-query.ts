// features/warehouses/hooks/use-warehouses-query.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-keys';
import { warehouseApi } from '../services/warehouse-api';
import {
  WarehouseFilters,
  CreateWarehouseData,
  UpdateWarehouseData,
  BinLocationFilters,
  CreateBinLocationData,
  UpdateBinLocationData,
  CustomerWarehouseAssignmentFilters,
  CreateCustomerWarehouseAssignmentData,
  UpdateCustomerWarehouseAssignmentData
} from '../types/warehouse.types';
import { toast } from 'sonner';

// Warehouse Queries
export const useWarehouses = (filters: WarehouseFilters = {}) => {
  return useQuery({
    queryKey: queryKeys.warehouses.list(filters),
    queryFn: () => warehouseApi.getWarehouses(filters),
    select: (data) => data, // Return full response with data and pagination
  });
};

export const useWarehouse = (id: string) => {
  return useQuery({
    queryKey: queryKeys.warehouses.detail(id),
    queryFn: () => warehouseApi.getWarehouse(id),
    select: (data) => data.data,
    enabled: !!id,
  });
};

export const useWarehouseStatistics = () => {
  return useQuery({
    queryKey: queryKeys.warehouses.statistics(),
    queryFn: () => warehouseApi.getWarehouseStatistics(),
    select: (data) => data.data,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useWarehouseCapacity = (id: string) => {
  return useQuery({
    queryKey: queryKeys.warehouses.capacity(id),
    queryFn: () => warehouseApi.getWarehouseCapacity(id),
    select: (data) => data.data,
    enabled: !!id,
  });
};

// Warehouse Mutations
export const useCreateWarehouse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWarehouseData) => warehouseApi.createWarehouse(data),
    onSuccess: (response) => {
      toast.success('Warehouse created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.warehouses.lists() });
    },
    onError: (error) => {
      toast.error('Failed to create warehouse');
      console.error('Create warehouse error:', error);
    },
  });
};

export const useUpdateWarehouse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWarehouseData }) =>
      warehouseApi.updateWarehouse(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.warehouses.detail(id) });
      
      const previousWarehouse = queryClient.getQueryData(queryKeys.warehouses.detail(id));
      
      queryClient.setQueryData(queryKeys.warehouses.detail(id), (old: any) => ({
        ...old,
        data: { ...old?.data, ...data }
      }));
      
      return { previousWarehouse };
    },
    onSuccess: (response, { id }) => {
      toast.success('Warehouse updated successfully');
      queryClient.setQueryData(queryKeys.warehouses.detail(id), response);
      queryClient.invalidateQueries({ queryKey: queryKeys.warehouses.lists() });
    },
    onError: (err, { id }, context) => {
      toast.error('Failed to update warehouse');
      if (context?.previousWarehouse) {
        queryClient.setQueryData(queryKeys.warehouses.detail(id), context.previousWarehouse);
      }
    },
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.warehouses.detail(id) });
    },
  });
};

export const useDeleteWarehouse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => warehouseApi.deleteWarehouse(id),
    onSuccess: () => {
      toast.success('Warehouse deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.warehouses.lists() });
    },
    onError: () => {
      toast.error('Failed to delete warehouse');
    },
  });
};

// Bin Location Queries
export const useBinLocations = (filters: BinLocationFilters = {}) => {
  return useQuery({
    queryKey: queryKeys.warehouses.binLocations.list(filters),
    queryFn: () => warehouseApi.getBinLocations(filters),
    select: (data) => data,
  });
};

export const useBinLocation = (id: string) => {
  return useQuery({
    queryKey: queryKeys.warehouses.binLocations.detail(id),
    queryFn: () => warehouseApi.getBinLocation(id),
    select: (data) => data.data,
    enabled: !!id,
  });
};

// Bin Location Mutations
export const useCreateBinLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBinLocationData) => warehouseApi.createBinLocation(data),
    onSuccess: (response) => {
      toast.success('Bin location created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.warehouses.binLocations.lists() });
      // Also invalidate warehouse capacity data
      if (response.data.warehouseId) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.warehouses.capacity(response.data.warehouseId) 
        });
      }
    },
    onError: (error) => {
      toast.error('Failed to create bin location');
      console.error('Create bin location error:', error);
    },
  });
};

export const useUpdateBinLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBinLocationData }) =>
      warehouseApi.updateBinLocation(id, data),
    onSuccess: (response, { id }) => {
      toast.success('Bin location updated successfully');
      queryClient.setQueryData(queryKeys.warehouses.binLocations.detail(id), response);
      queryClient.invalidateQueries({ queryKey: queryKeys.warehouses.binLocations.lists() });
    },
    onError: () => {
      toast.error('Failed to update bin location');
    },
  });
};

export const useDeleteBinLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => warehouseApi.deleteBinLocation(id),
    onSuccess: () => {
      toast.success('Bin location deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.warehouses.binLocations.lists() });
    },
    onError: () => {
      toast.error('Failed to delete bin location');
    },
  });
};

// Customer Warehouse Assignment Queries
export const useCustomerWarehouseAssignments = (filters: CustomerWarehouseAssignmentFilters = {}) => {
  return useQuery({
    queryKey: queryKeys.warehouses.assignments.list(filters),
    queryFn: () => warehouseApi.getCustomerWarehouseAssignments(filters),
    select: (data) => data,
  });
};

export const useCustomerWarehouseAssignment = (id: string) => {
  return useQuery({
    queryKey: queryKeys.warehouses.assignments.detail(id),
    queryFn: () => warehouseApi.getCustomerWarehouseAssignment(id),
    select: (data) => data.data,
    enabled: !!id,
  });
};

// Customer Warehouse Assignment Mutations
export const useCreateCustomerWarehouseAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCustomerWarehouseAssignmentData) =>
      warehouseApi.createCustomerWarehouseAssignment(data),
    onSuccess: () => {
      toast.success('Customer warehouse assignment created successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.warehouses.assignments.lists() });
    },
    onError: () => {
      toast.error('Failed to create customer warehouse assignment');
    },
  });
};

export const useUpdateCustomerWarehouseAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomerWarehouseAssignmentData }) =>
      warehouseApi.updateCustomerWarehouseAssignment(id, data),
    onSuccess: (response, { id }) => {
      toast.success('Customer warehouse assignment updated successfully');
      queryClient.setQueryData(queryKeys.warehouses.assignments.detail(id), response);
      queryClient.invalidateQueries({ queryKey: queryKeys.warehouses.assignments.lists() });
    },
    onError: () => {
      toast.error('Failed to update customer warehouse assignment');
    },
  });
};

export const useDeleteCustomerWarehouseAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => warehouseApi.deleteCustomerWarehouseAssignment(id),
    onSuccess: () => {
      toast.success('Customer warehouse assignment deleted successfully');
      queryClient.invalidateQueries({ queryKey: queryKeys.warehouses.assignments.lists() });
    },
    onError: () => {
      toast.error('Failed to delete customer warehouse assignment');
    },
  });
};