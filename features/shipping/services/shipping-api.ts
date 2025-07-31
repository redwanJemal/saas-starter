// features/shipping/services/shipping-api.ts

import { apiClient, ApiResponse, PaginatedResponse } from '@/shared/services/api/client';
import type {
  Zone,
  ZoneFilters,
  CreateZoneData,
  UpdateZoneData,
  ShippingRate,
  ShippingRateFilters,
  CreateShippingRateData,
  UpdateShippingRateData,
  Shipment,
  ShipmentFilters,
  CreateShipmentData,
  UpdateShipmentData,
  CreateShipmentTrackingEventData,
  ShippingStatistics,
  RateCalculationRequest,
  RateCalculationResult,
  BulkShipmentUpdateData,
  BulkShipmentResult,
} from '../types/shipping.types';

export const shippingApi = {
  // ============================================================================
  // ZONE APIs
  // ============================================================================
  
  // Zone Queries
  getZones: async (filters: ZoneFilters = {}): Promise<PaginatedResponse<Zone>> => {
    return apiClient.get('/admin/shipping/zones', { params: filters });
  },

  getZone: async (id: string): Promise<ApiResponse<Zone>> => {
    return apiClient.get(`/admin/shipping/zones/${id}`);
  },

  // Zone Mutations
  createZone: async (data: CreateZoneData): Promise<ApiResponse<Zone>> => {
    return apiClient.post('/admin/shipping/zones', data);
  },

  updateZone: async (id: string, data: UpdateZoneData): Promise<ApiResponse<Zone>> => {
    return apiClient.patch(`/admin/shipping/zones/${id}`, data);
  },

  deleteZone: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/admin/shipping/zones/${id}`);
  },

  // ============================================================================
  // SHIPPING RATE APIs
  // ============================================================================
  
  // Shipping Rate Queries
  getShippingRates: async (filters: ShippingRateFilters = {}): Promise<PaginatedResponse<ShippingRate>> => {
    return apiClient.get('/admin/shipping/rates', { params: filters });
  },

  getShippingRate: async (id: string): Promise<ApiResponse<ShippingRate>> => {
    return apiClient.get(`/admin/shipping/rates/${id}`);
  },

  calculateRates: async (data: RateCalculationRequest): Promise<ApiResponse<RateCalculationResult[]>> => {
    return apiClient.post('/admin/shipping/rates/calculate', data);
  },

  getActiveRatesForZone: async (zoneId: string, warehouseId?: string): Promise<ApiResponse<ShippingRate[]>> => {
    return apiClient.get(`/admin/shipping/rates/zone/${zoneId}`, { 
      params: { warehouseId } 
    });
  },

  // Shipping Rate Mutations
  createShippingRate: async (data: CreateShippingRateData): Promise<ApiResponse<ShippingRate>> => {
    return apiClient.post('/admin/shipping/rates', data);
  },

  updateShippingRate: async (id: string, data: UpdateShippingRateData): Promise<ApiResponse<ShippingRate>> => {
    return apiClient.patch(`/admin/shipping/rates/${id}`, data);
  },

  deleteShippingRate: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/admin/shipping/rates/${id}`);
  },

  // ============================================================================
  // SHIPMENT APIs
  // ============================================================================
  
  // Shipment Queries
  getShipments: async (filters: ShipmentFilters = {}): Promise<PaginatedResponse<Shipment>> => {
    return apiClient.get('/admin/shipping/shipments', { params: filters });
  },

  getShipment: async (id: string): Promise<ApiResponse<Shipment>> => {
    return apiClient.get(`/admin/shipping/shipments/${id}`);
  },

  getShipmentStatistics: async (): Promise<ApiResponse<ShippingStatistics>> => {
    return apiClient.get('/admin/shipping/statistics');
  },

  // Shipment Mutations
  createShipment: async (data: CreateShipmentData): Promise<ApiResponse<Shipment>> => {
    return apiClient.post('/admin/shipping/shipments', data);
  },

  updateShipment: async (id: string, data: UpdateShipmentData): Promise<ApiResponse<Shipment>> => {
    return apiClient.patch(`/admin/shipping/shipments/${id}`, data);
  },

  deleteShipment: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/admin/shipping/shipments/${id}`);
  },

  // Shipment Package Management
  addPackageToShipment: async (shipmentId: string, packageId: string, data?: { declaredValue?: string; declaredDescription?: string }): Promise<ApiResponse<void>> => {
    return apiClient.post(`/admin/shipping/shipments/${shipmentId}/packages`, {
      packageId,
      ...data
    });
  },

  removePackageFromShipment: async (shipmentId: string, packageId: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/admin/shipping/shipments/${shipmentId}/packages/${packageId}`);
  },

  // Shipment Status Management
  updateShipmentStatus: async (id: string, status: string, notes?: string): Promise<ApiResponse<Shipment>> => {
    return apiClient.patch(`/admin/shipping/shipments/${id}/status`, { status, notes });
  },

  bulkUpdateShipments: async (data: BulkShipmentUpdateData): Promise<ApiResponse<BulkShipmentResult>> => {
    return apiClient.patch('/admin/shipping/shipments/bulk', data);
  },

  // ============================================================================
  // TRACKING APIs
  // ============================================================================
  
  // Tracking Events
  createTrackingEvent: async (data: CreateShipmentTrackingEventData): Promise<ApiResponse<void>> => {
    return apiClient.post('/admin/shipping/tracking/events', data);
  },

  getShipmentTrackingEvents: async (shipmentId: string): Promise<ApiResponse<any[]>> => {
    return apiClient.get(`/admin/shipping/shipments/${shipmentId}/tracking`);
  },

  getShipmentStatusHistory: async (shipmentId: string): Promise<ApiResponse<any[]>> => {
    return apiClient.get(`/admin/shipping/shipments/${shipmentId}/status-history`);
  },

  // ============================================================================
  // UTILITY APIs
  // ============================================================================
  
  // Search and Suggestions
  searchZones: async (query: string): Promise<ApiResponse<Zone[]>> => {
    return apiClient.get('/admin/shipping/zones/search', { params: { q: query } });
  },

  getAvailableCarriers: async (): Promise<ApiResponse<string[]>> => {
    return apiClient.get('/admin/shipping/carriers');
  },

  getServiceTypes: async (): Promise<ApiResponse<string[]>> => {
    return apiClient.get('/admin/shipping/service-types');
  },
};