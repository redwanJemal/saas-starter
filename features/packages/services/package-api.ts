import { apiClient, ApiResponse, PaginatedResponse } from '@/shared/services/api/client';
import { Package, PackageFilters, CreatePackageData, UpdatePackageData } from '../types/package.types';

export const packageApi = {
  // Queries
  getPackages: async (filters: PackageFilters = {}): Promise<PaginatedResponse<Package>> => {
    return apiClient.get('/packages', { params: filters });
  },

  getPackage: async (id: string): Promise<ApiResponse<Package>> => {
    return apiClient.get(`/packages/${id}`);
  },

  searchPackages: async (query: string): Promise<ApiResponse<Package[]>> => {
    return apiClient.get('/packages/search', { params: { q: query } });
  },

  // Mutations
  createPackage: async (data: CreatePackageData): Promise<ApiResponse<Package>> => {
    return apiClient.post('/packages', data);
  },

  updatePackage: async (id: string, data: UpdatePackageData): Promise<ApiResponse<Package>> => {
    return apiClient.patch(`/packages/${id}`, data);
  },

  deletePackage: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/packages/${id}`);
  },

  updateStatus: async (id: string, status: string): Promise<ApiResponse<Package>> => {
    return apiClient.patch(`/packages/${id}/status`, { status });
  },

  uploadPhoto: async (id: string, file: File): Promise<ApiResponse<string>> => {
    const formData = new FormData();
    formData.append('photo', file);
    return apiClient.post(`/packages/${id}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  bulkUpdateStatus: async (ids: string[], status: string): Promise<ApiResponse<Package[]>> => {
    return apiClient.patch('/packages/bulk-status', { ids, status });
  },
};
