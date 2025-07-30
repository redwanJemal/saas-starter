// features/warehouses/services/warehouse-api.ts

import { apiClient, ApiResponse, PaginatedResponse } from '@/shared/services/api/client';
import {
  Warehouse,
  WarehouseFilters,
  CreateWarehouseData,
  UpdateWarehouseData,
  BinLocation,
  BinLocationFilters,
  CreateBinLocationData,
  UpdateBinLocationData,
  WarehouseStatistics,
  AggregateWarehouseStats,
  CustomerWarehouseAssignment,
  CustomerWarehouseAssignmentFilters,
  CreateCustomerWarehouseAssignmentData,
  UpdateCustomerWarehouseAssignmentData
} from '../types/warehouse.types';

export const warehouseApi = {
  // Warehouse Queries
  getWarehouses: async (filters: WarehouseFilters = {}): Promise<PaginatedResponse<Warehouse>> => {
    return apiClient.get('/admin/warehouses', { params: filters });
  },

  getWarehouse: async (id: string): Promise<ApiResponse<Warehouse>> => {
    return apiClient.get(`/admin/warehouses/${id}`);
  },

  getWarehouseStatistics: async (): Promise<ApiResponse<{
    warehouses: WarehouseStatistics[];
    aggregate: AggregateWarehouseStats;
  }>> => {
    return apiClient.get('/admin/warehouses/statistics');
  },

  getWarehouseCapacity: async (id: string): Promise<ApiResponse<any>> => {
    return apiClient.get(`/admin/warehouses/${id}/capacity`);
  },

  // Warehouse Mutations
  createWarehouse: async (data: CreateWarehouseData): Promise<ApiResponse<Warehouse>> => {
    return apiClient.post('/admin/warehouses', data);
  },

  updateWarehouse: async (id: string, data: UpdateWarehouseData): Promise<ApiResponse<Warehouse>> => {
    return apiClient.patch(`/admin/warehouses/${id}`, data);
  },

  deleteWarehouse: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/admin/warehouses/${id}`);
  },

  // Bin Location Queries
  getBinLocations: async (filters: BinLocationFilters = {}): Promise<PaginatedResponse<BinLocation>> => {
    return apiClient.get('/admin/warehouses/bins', { params: filters });
  },

  getBinLocation: async (id: string): Promise<ApiResponse<BinLocation>> => {
    return apiClient.get(`/admin/warehouses/bins/${id}`);
  },

  // Bin Location Mutations
  createBinLocation: async (data: CreateBinLocationData): Promise<ApiResponse<BinLocation>> => {
    return apiClient.post('/admin/warehouses/bins', data);
  },

  updateBinLocation: async (id: string, data: UpdateBinLocationData): Promise<ApiResponse<BinLocation>> => {
    return apiClient.patch(`/admin/warehouses/bins/${id}`, data);
  },

  deleteBinLocation: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/admin/warehouses/bins/${id}`);
  },

  // Customer Warehouse Assignments
  getCustomerWarehouseAssignments: async (
    filters: CustomerWarehouseAssignmentFilters = {}
  ): Promise<PaginatedResponse<CustomerWarehouseAssignment>> => {
    return apiClient.get('/admin/warehouses/assignments', { params: filters });
  },

  getCustomerWarehouseAssignment: async (id: string): Promise<ApiResponse<CustomerWarehouseAssignment>> => {
    return apiClient.get(`/admin/warehouses/assignments/${id}`);
  },

  createCustomerWarehouseAssignment: async (
    data: CreateCustomerWarehouseAssignmentData
  ): Promise<ApiResponse<CustomerWarehouseAssignment>> => {
    return apiClient.post('/admin/warehouses/assignments', data);
  },

  updateCustomerWarehouseAssignment: async (
    id: string,
    data: UpdateCustomerWarehouseAssignmentData
  ): Promise<ApiResponse<CustomerWarehouseAssignment>> => {
    return apiClient.patch(`/admin/warehouses/assignments/${id}`, data);
  },

  deleteCustomerWarehouseAssignment: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/admin/warehouses/assignments/${id}`);
  },
};