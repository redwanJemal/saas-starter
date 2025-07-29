import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-keys';
import { customerApi } from '../services/customer-api';
import { CustomerFilters, CreateCustomerData, UpdateCustomerData } from '../types/customer.types';
import { useGlobalStore } from '@/shared/stores/global-store';

// Queries
export const useCustomers = (filters: CustomerFilters = {}) => {
  return useQuery({
    queryKey: queryKeys.customers.list(filters),
    queryFn: () => customerApi.getCustomers(filters),
    select: (data) => data, // Return full response with data and pagination
  });
};

export const useCustomer = (id: string) => {
  return useQuery({
    queryKey: queryKeys.customers.detail(id),
    queryFn: () => customerApi.getCustomer(id),
    select: (data) => data.data,
    enabled: !!id,
  });
};

export const useCustomerSearch = (query: string) => {
  return useQuery({
    queryKey: queryKeys.customers.search(query),
    queryFn: () => customerApi.searchCustomers(query),
    select: (data) => data.data,
    enabled: query.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Mutations
export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  const addNotification = useGlobalStore(state => state.addNotification);

  return useMutation({
    mutationFn: customerApi.createCustomer,
    onSuccess: (response) => {
      // Invalidate and refetch customers list
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.customers.lists() 
      });
      
      addNotification({
        type: 'success',
        message: 'Customer created successfully',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to create customer',
      });
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  const addNotification = useGlobalStore(state => state.addNotification);

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomerData }) =>
      customerApi.updateCustomer(id, data),
    
    // Optimistic update
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.customers.detail(id) });
      
      const previousCustomer = queryClient.getQueryData(queryKeys.customers.detail(id));
      
      queryClient.setQueryData(queryKeys.customers.detail(id), (old: any) => ({
        ...old,
        data: { ...old?.data, ...data }
      }));

      return { previousCustomer };
    },

    onError: (err, variables, context) => {
      if (context?.previousCustomer) {
        queryClient.setQueryData(
          queryKeys.customers.detail(variables.id),
          context.previousCustomer
        );
      }
      
      addNotification({
        type: 'error',
        message: 'Failed to update customer',
      });
    },

    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
      
      addNotification({
        type: 'success',
        message: 'Customer updated successfully',
      });
    },
  });
};

export const useUpdateCustomerStatus = () => {
  const queryClient = useQueryClient();
  const addNotification = useGlobalStore(state => state.addNotification);

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      customerApi.updateStatus(id, status),
      
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.customers.detail(id) });
      
      const previousCustomer = queryClient.getQueryData(queryKeys.customers.detail(id));
      
      queryClient.setQueryData(queryKeys.customers.detail(id), (old: any) => ({
        ...old,
        data: { ...old?.data, status }
      }));

      return { previousCustomer };
    },

    onError: (err, variables, context) => {
      if (context?.previousCustomer) {
        queryClient.setQueryData(
          queryKeys.customers.detail(variables.id),
          context.previousCustomer
        );
      }
    },

    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
    },
  });
};
