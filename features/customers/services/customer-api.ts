import { apiClient, ApiResponse, PaginatedResponse } from '@/shared/services/api/client';
import { Customer, CustomerFilters, CreateCustomerData, UpdateCustomerData } from '../types/customer.types';

export const customerApi = {
  // Queries
  getCustomers: async (filters: CustomerFilters = {}): Promise<PaginatedResponse<Customer>> => {
    return apiClient.get('/customers', { params: filters });
  },

  getCustomer: async (id: string): Promise<ApiResponse<Customer>> => {
    return apiClient.get(`/customers/${id}`);
  },

  searchCustomers: async (query: string): Promise<ApiResponse<Customer[]>> => {
    return apiClient.get('/admin/customers/search', { params: { q: query } });
  },

  // Mutations
  createCustomer: async (data: CreateCustomerData): Promise<ApiResponse<Customer>> => {
    return apiClient.post('/customers', data);
  },

  updateCustomer: async (id: string, data: UpdateCustomerData): Promise<ApiResponse<Customer>> => {
    return apiClient.patch(`/customers/${id}`, data);
  },

  deleteCustomer: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/customers/${id}`);
  },

  updateStatus: async (id: string, status: string): Promise<ApiResponse<Customer>> => {
    return apiClient.patch(`/customers/${id}/status`, { status });
  },
};
