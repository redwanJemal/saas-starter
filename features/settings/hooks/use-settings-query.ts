// features/settings/hooks/use-settings-query.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-keys';
import { settingsApi } from '../services/settings-api';
import type {
  CountryFilters,
  CurrencyFilters,
  CourierFilters,
  NewCountry,
  NewCurrency,
  NewCourier,
  UpdateCountryData,
  UpdateCurrencyData,
  UpdateCourierData,
  CreateTenantCurrencyData,
  CreateTenantCourierData,
  UpdateTenantCurrencyData,
  UpdateTenantCourierData
} from '../types/settings.types';
import { toast } from 'sonner';

// ============================================================================
// COUNTRY HOOKS
// ============================================================================

export const useCountries = (filters: CountryFilters = {}) => {
  return useQuery({
    queryKey: queryKeys.settings.countries.list(filters),
    queryFn: () => settingsApi.getCountries(filters),
    select: (data) => data,
  });
};

export const useCountry = (id: string) => {
  return useQuery({
    queryKey: queryKeys.settings.countries.detail(id),
    queryFn: () => settingsApi.getCountry(id),
    select: (data) => data.data,
    enabled: !!id,
  });
};

export const useCountryStatistics = () => {
  return useQuery({
    queryKey: queryKeys.settings.countries.stats(),
    queryFn: () => settingsApi.getCountryStatistics(),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateCountry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NewCountry) => settingsApi.createCountry(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.countries.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.countries.stats() });
      toast.success('Country created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create country');
    },
  });
};

export const useUpdateCountry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCountryData }) =>
      settingsApi.updateCountry(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.countries.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.countries.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.countries.stats() });
      toast.success('Country updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update country');
    },
  });
};

export const useDeleteCountry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => settingsApi.deleteCountry(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.countries.lists() });
      queryClient.removeQueries({ queryKey: queryKeys.settings.countries.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.countries.stats() });
      toast.success('Country deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete country');
    },
  });
};

// ============================================================================
// CURRENCY HOOKS
// ============================================================================

export const useCurrencies = (filters: CurrencyFilters = {}) => {
  return useQuery({
    queryKey: queryKeys.settings.currencies.list(filters),
    queryFn: () => settingsApi.getCurrencies(filters),
    select: (data) => data,
  });
};

export const useCurrency = (id: string) => {
  return useQuery({
    queryKey: queryKeys.settings.currencies.detail(id),
    queryFn: () => settingsApi.getCurrency(id),
    select: (data) => data.data,
    enabled: !!id,
  });
};

export const useCurrencyStatistics = () => {
  return useQuery({
    queryKey: queryKeys.settings.currencies.stats(),
    queryFn: () => settingsApi.getCurrencyStatistics(),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateCurrency = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NewCurrency) => settingsApi.createCurrency(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.currencies.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.currencies.stats() });
      toast.success('Currency created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create currency');
    },
  });
};

export const useUpdateCurrency = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCurrencyData }) =>
      settingsApi.updateCurrency(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.currencies.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.currencies.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.currencies.stats() });
      toast.success('Currency updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update currency');
    },
  });
};

export const useDeleteCurrency = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => settingsApi.deleteCurrency(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.currencies.lists() });
      queryClient.removeQueries({ queryKey: queryKeys.settings.currencies.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.currencies.stats() });
      toast.success('Currency deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete currency');
    },
  });
};

// ============================================================================
// COURIER HOOKS
// ============================================================================

export const useCouriers = (filters: CourierFilters = {}) => {
  return useQuery({
    queryKey: queryKeys.settings.couriers.list(filters),
    queryFn: () => settingsApi.getCouriers(filters),
    select: (data) => data,
  });
};

export const useCourier = (id: string) => {
  return useQuery({
    queryKey: queryKeys.settings.couriers.detail(id),
    queryFn: () => settingsApi.getCourier(id),
    select: (data) => data.data,
    enabled: !!id,
  });
};

export const useCourierStatistics = () => {
  return useQuery({
    queryKey: queryKeys.settings.couriers.stats(),
    queryFn: () => settingsApi.getCourierStatistics(),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateCourier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NewCourier) => settingsApi.createCourier(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.couriers.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.couriers.stats() });
      toast.success('Courier created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create courier');
    },
  });
};

export const useUpdateCourier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCourierData }) =>
      settingsApi.updateCourier(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.couriers.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.couriers.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.couriers.stats() });
      toast.success('Courier updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update courier');
    },
  });
};

export const useDeleteCourier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => settingsApi.deleteCourier(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.couriers.lists() });
      queryClient.removeQueries({ queryKey: queryKeys.settings.couriers.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.couriers.stats() });
      toast.success('Courier deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete courier');
    },
  });
};

// ============================================================================
// TENANT CONFIGURATION HOOKS
// ============================================================================

export const useTenantCurrencies = () => {
  return useQuery({
    queryKey: queryKeys.settings.tenantCurrencies.lists(),
    queryFn: () => settingsApi.getTenantCurrencies(),
    select: (data) => data.data,
  });
};

export const useTenantCurrency = (id: string) => {
  return useQuery({
    queryKey: queryKeys.settings.tenantCurrencies.detail(id),
    queryFn: () => settingsApi.getTenantCurrency(id),
    select: (data) => data.data,
    enabled: !!id,
  });
};

export const useCreateTenantCurrency = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTenantCurrencyData) => settingsApi.createTenantCurrency(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.tenantCurrencies.lists() });
      toast.success('Tenant currency configuration created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create tenant currency configuration');
    },
  });
};

export const useUpdateTenantCurrency = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTenantCurrencyData }) =>
      settingsApi.updateTenantCurrency(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.tenantCurrencies.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.tenantCurrencies.detail(id) });
      toast.success('Tenant currency configuration updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update tenant currency configuration');
    },
  });
};

export const useDeleteTenantCurrency = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => settingsApi.deleteTenantCurrency(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.tenantCurrencies.lists() });
      queryClient.removeQueries({ queryKey: queryKeys.settings.tenantCurrencies.detail(id) });
      toast.success('Tenant currency configuration deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete tenant currency configuration');
    },
  });
};

export const useTenantCouriers = () => {
  return useQuery({
    queryKey: queryKeys.settings.tenantCouriers.lists(),
    queryFn: () => settingsApi.getTenantCouriers(),
    select: (data) => data.data,
  });
};

export const useTenantCourier = (id: string) => {
  return useQuery({
    queryKey: queryKeys.settings.tenantCouriers.detail(id),
    queryFn: () => settingsApi.getTenantCourier(id),
    select: (data) => data.data,
    enabled: !!id,
  });
};

export const useCreateTenantCourier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTenantCourierData) => settingsApi.createTenantCourier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.tenantCouriers.lists() });
      toast.success('Tenant courier configuration created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create tenant courier configuration');
    },
  });
};

export const useUpdateTenantCourier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTenantCourierData }) =>
      settingsApi.updateTenantCourier(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.tenantCouriers.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.tenantCouriers.detail(id) });
      toast.success('Tenant courier configuration updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update tenant courier configuration');
    },
  });
};

export const useDeleteTenantCourier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => settingsApi.deleteTenantCourier(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.tenantCouriers.lists() });
      queryClient.removeQueries({ queryKey: queryKeys.settings.tenantCouriers.detail(id) });
      toast.success('Tenant courier configuration deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete tenant courier configuration');
    },
  });
};

// ============================================================================
// CUSTOMER-FACING HOOKS
// ============================================================================

export const useCustomerCountries = (filters: CountryFilters = {}) => {
  return useQuery({
    queryKey: queryKeys.settings.customerCountries.list(filters),
    queryFn: () => settingsApi.getCustomerCountries(filters),
    select: (data) => data,
  });
};

export const useCustomerCurrencies = (filters: CurrencyFilters = {}) => {
  return useQuery({
    queryKey: queryKeys.settings.customerCurrencies.list(filters),
    queryFn: () => settingsApi.getCustomerCurrencies(filters),
    select: (data) => data,
  });
};

export const useCustomerCouriers = (filters: CourierFilters = {}) => {
  return useQuery({
    queryKey: queryKeys.settings.customerCouriers.list(filters),
    queryFn: () => settingsApi.getCustomerCouriers(filters),
    select: (data) => data,
  });
};