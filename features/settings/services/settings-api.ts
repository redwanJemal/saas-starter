// features/settings/services/settings-api.ts
import { apiClient, ApiResponse, PaginatedResponse } from '@/shared/services/api/client';
import type {
  Country,
  Currency,
  Courier,
  CountryFilters,
  CurrencyFilters,
  CourierFilters,
  NewCountry,
  NewCurrency,
  NewCourier,
  UpdateCountryData,
  UpdateCurrencyData,
  UpdateCourierData,
  TenantCurrency,
  TenantCourier,
  CreateTenantCurrencyData,
  CreateTenantCourierData,
  UpdateTenantCurrencyData,
  UpdateTenantCourierData,
  CountryStatistics,
  CurrencyStatistics,
  CourierStatistics
} from '../types/settings.types';

export const settingsApi = {
  // Countries API
  getCountries: async (filters: CountryFilters = {}): Promise<PaginatedResponse<Country>> => {
    return apiClient.get('/admin/settings/countries', { params: filters });
  },

  getCountry: async (id: string): Promise<ApiResponse<Country>> => {
    return apiClient.get(`/admin/settings/countries/${id}`);
  },

  createCountry: async (data: NewCountry): Promise<ApiResponse<Country>> => {
    return apiClient.post('/admin/settings/countries', data);
  },

  updateCountry: async (id: string, data: UpdateCountryData): Promise<ApiResponse<Country>> => {
    return apiClient.patch(`/admin/settings/countries/${id}`, data);
  },

  deleteCountry: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/admin/settings/countries/${id}`);
  },

  getCountryStatistics: async (): Promise<ApiResponse<CountryStatistics[]>> => {
    return apiClient.get('/admin/settings/countries/statistics');
  },

  // Currencies API
  getCurrencies: async (filters: CurrencyFilters = {}): Promise<PaginatedResponse<Currency>> => {
    return apiClient.get('/admin/settings/currencies', { params: filters });
  },

  getCurrency: async (id: string): Promise<ApiResponse<Currency>> => {
    return apiClient.get(`/admin/settings/currencies/${id}`);
  },

  createCurrency: async (data: NewCurrency): Promise<ApiResponse<Currency>> => {
    return apiClient.post('/admin/settings/currencies', data);
  },

  updateCurrency: async (id: string, data: UpdateCurrencyData): Promise<ApiResponse<Currency>> => {
    return apiClient.patch(`/admin/settings/currencies/${id}`, data);
  },

  deleteCurrency: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/admin/settings/currencies/${id}`);
  },

  getCurrencyStatistics: async (): Promise<ApiResponse<CurrencyStatistics[]>> => {
    return apiClient.get('/admin/settings/currencies/statistics');
  },

  // Couriers API
  getCouriers: async (filters: CourierFilters = {}): Promise<PaginatedResponse<Courier>> => {
    return apiClient.get('/admin/settings/couriers', { params: filters });
  },

  getCourier: async (id: string): Promise<ApiResponse<Courier>> => {
    return apiClient.get(`/admin/settings/couriers/${id}`);
  },

  createCourier: async (data: NewCourier): Promise<ApiResponse<Courier>> => {
    return apiClient.post('/admin/settings/couriers', data);
  },

  updateCourier: async (id: string, data: UpdateCourierData): Promise<ApiResponse<Courier>> => {
    return apiClient.patch(`/admin/settings/couriers/${id}`, data);
  },

  deleteCourier: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/admin/settings/couriers/${id}`);
  },

  getCourierStatistics: async (): Promise<ApiResponse<CourierStatistics[]>> => {
    return apiClient.get('/admin/settings/couriers/statistics');
  },

  // Tenant Currencies API
  getTenantCurrencies: async (): Promise<ApiResponse<TenantCurrency[]>> => {
    return apiClient.get('/admin/settings/tenant-currencies');
  },

  getTenantCurrency: async (id: string): Promise<ApiResponse<TenantCurrency>> => {
    return apiClient.get(`/admin/settings/tenant-currencies/${id}`);
  },

  createTenantCurrency: async (data: CreateTenantCurrencyData): Promise<ApiResponse<TenantCurrency>> => {
    return apiClient.post('/admin/settings/tenant-currencies', data);
  },

  updateTenantCurrency: async (id: string, data: UpdateTenantCurrencyData): Promise<ApiResponse<TenantCurrency>> => {
    return apiClient.patch(`/admin/settings/tenant-currencies/${id}`, data);
  },

  deleteTenantCurrency: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/admin/settings/tenant-currencies/${id}`);
  },

  // Tenant Couriers API
  getTenantCouriers: async (): Promise<ApiResponse<TenantCourier[]>> => {
    return apiClient.get('/admin/settings/tenant-couriers');
  },

  getTenantCourier: async (id: string): Promise<ApiResponse<TenantCourier>> => {
    return apiClient.get(`/admin/settings/tenant-couriers/${id}`);
  },

  createTenantCourier: async (data: CreateTenantCourierData): Promise<ApiResponse<TenantCourier>> => {
    return apiClient.post('/admin/settings/tenant-couriers', data);
  },

  updateTenantCourier: async (id: string, data: UpdateTenantCourierData): Promise<ApiResponse<TenantCourier>> => {
    return apiClient.patch(`/admin/settings/tenant-couriers/${id}`, data);
  },

  deleteTenantCourier: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/admin/settings/tenant-couriers/${id}`);
  },

  // Customer APIs (read-only access)
  getCustomerCountries: async (filters: CountryFilters = {}): Promise<PaginatedResponse<Country>> => {
    return apiClient.get('/customer/countries', { params: filters });
  },

  getCustomerCurrencies: async (filters: CurrencyFilters = {}): Promise<PaginatedResponse<Currency>> => {
    return apiClient.get('/customer/currencies', { params: filters });
  },

  getCustomerCouriers: async (filters: CourierFilters = {}): Promise<PaginatedResponse<Courier>> => {
    return apiClient.get('/customer/couriers', { params: filters });
  },
};