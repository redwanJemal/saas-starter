// features/packages/services/package-api.service.ts

import { apiClient, ApiResponse } from '@/shared/services/api/client';
import type { PaginatedResponse } from '@/shared/types/api.types';
import type {
  PackageWithDetails,
  PackageWithHistory,
  PackageFilters,
  CreatePackageData,
  UpdatePackageData,
  BulkPackageAction,
  BulkStatusUpdate,
  PackageStatistics,
  AttachDocumentData,
  PackageDocumentResponse,
  IncomingShipmentWithItems,
  CreateIncomingShipmentData,
  UpdateIncomingShipmentData,
  CreateIncomingShipmentItemData,
  UpdateIncomingShipmentItemData,
} from '@/features/packages/types/package.types';

export const packageApiService = {
  // ============================================================================
  // PACKAGE QUERIES
  // ============================================================================

  /**
   * Get all packages with filtering and pagination
   */
  getPackages: async (filters: PackageFilters = {}): Promise<PaginatedResponse<PackageWithDetails>> => {
    return apiClient.get('/admin/packages', { params: filters });
  },

  /**
   * Get a specific package by ID with full details
   */
  getPackage: async (id: string): Promise<ApiResponse<PackageWithHistory>> => {
    return apiClient.get(`/admin/packages/${id}`);
  },

  /**
   * Get package statistics and metrics
   */
  getPackageStatistics: async (): Promise<ApiResponse<PackageStatistics>> => {
    return apiClient.get('/admin/packages/statistics');
  },

  /**
   * Get expected packages (packages with status 'expected')
   */
  getExpectedPackages: async (filters: Omit<PackageFilters, 'status'> = {}): Promise<PaginatedResponse<PackageWithDetails>> => {
    return apiClient.get('/admin/packages/expected', { params: filters });
  },

  /**
   * Get received packages (packages with status 'received')
   */
  getReceivedPackages: async (filters: Omit<PackageFilters, 'status'> = {}): Promise<PaginatedResponse<PackageWithDetails>> => {
    return apiClient.get('/admin/packages/received', { params: filters });
  },

  /**
   * Get ready to ship packages (packages with status 'ready_to_ship')
   */
  getReadyToShipPackages: async (filters: Omit<PackageFilters, 'status'> = {}): Promise<PaginatedResponse<PackageWithDetails>> => {
    return apiClient.get('/admin/packages/ready-to-ship', { params: filters });
  },

  // ============================================================================
  // PACKAGE MUTATIONS
  // ============================================================================

  /**
   * Create a new package
   */
  createPackage: async (data: CreatePackageData): Promise<ApiResponse<PackageWithDetails>> => {
    return apiClient.post('/admin/packages', data);
  },

  /**
   * Update an existing package
   */
  updatePackage: async (id: string, data: UpdatePackageData): Promise<ApiResponse<PackageWithDetails>> => {
    return apiClient.patch(`/admin/packages/${id}`, data);
  },

  /**
   * Delete a package
   */
  deletePackage: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/admin/packages/${id}`);
  },

  /**
   * Bulk update packages
   */
  bulkUpdatePackages: async (action: BulkPackageAction): Promise<ApiResponse<{ updated: number; failed: string[] }>> => {
    return apiClient.post('/admin/packages/bulk-update', action);
  },

  /**
   * Bulk update package statuses
   */
  bulkUpdateStatus: async (updates: BulkStatusUpdate): Promise<ApiResponse<{ updated: number; failed: string[] }>> => {
    return apiClient.post('/admin/packages/bulk-status', updates);
  },

  // ============================================================================
  // PACKAGE STATUS MANAGEMENT
  // ============================================================================

  /**
   * Update package status
   */
  updatePackageStatus: async (
    id: string, 
    status: string, 
    reason?: string, 
    notes?: string
  ): Promise<ApiResponse<PackageWithDetails>> => {
    return apiClient.patch(`/admin/packages/${id}/status`, {
      status,
      reason,
      notes,
    });
  },

  /**
   * Mark package as received
   */
  markPackageReceived: async (
    id: string, 
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
  ): Promise<ApiResponse<PackageWithDetails>> => {
    return apiClient.post(`/admin/packages/${id}/receive`, data);
  },

  /**
   * Mark package as ready to ship
   */
  markPackageReadyToShip: async (
    id: string,
    notes?: string
  ): Promise<ApiResponse<PackageWithDetails>> => {
    return apiClient.post(`/admin/packages/${id}/ready-to-ship`, { notes });
  },

  /**
   * Mark package as shipped
   */
  markPackageShipped: async (
    id: string,
    data: {
      trackingNumberOutbound: string;
      shippedAt?: string;
      notes?: string;
    }
  ): Promise<ApiResponse<PackageWithDetails>> => {
    return apiClient.post(`/admin/packages/${id}/ship`, data);
  },

  // ============================================================================
  // PACKAGE DOCUMENT MANAGEMENT
  // ============================================================================

  /**
   * Get all documents for a package
   */
  getPackageDocuments: async (packageId: string): Promise<ApiResponse<PackageDocumentResponse[]>> => {
    return apiClient.get(`/admin/packages/${packageId}/documents`);
  },

  /**
   * Attach a document to a package
   */
  attachDocument: async (packageId: string, data: AttachDocumentData): Promise<ApiResponse<PackageDocumentResponse>> => {
    return apiClient.post(`/admin/packages/${packageId}/documents`, data);
  },

  /**
   * Detach a document from a package
   */
  detachDocument: async (packageId: string, documentId: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/admin/packages/${packageId}/documents/${documentId}`);
  },

  /**
   * Update document attachment details
   */
  updateDocumentAttachment: async (
    packageId: string, 
    documentId: string, 
    data: Partial<AttachDocumentData>
  ): Promise<ApiResponse<PackageDocumentResponse>> => {
    return apiClient.patch(`/admin/packages/${packageId}/documents/${documentId}`, data);
  },

  // ============================================================================
  // INCOMING SHIPMENTS (PRE-RECEIVING WORKFLOW)
  // ============================================================================

  /**
   * Get all incoming shipments
   */
  getIncomingShipments: async (filters: {
    search?: string;
    status?: string;
    warehouseId?: string;
    courierName?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<PaginatedResponse<IncomingShipmentWithItems>> => {
    return apiClient.get('/admin/incoming-shipments', { params: filters });
  },

  /**
   * Get a specific incoming shipment by ID
   */
  getIncomingShipment: async (id: string): Promise<ApiResponse<IncomingShipmentWithItems>> => {
    return apiClient.get(`/admin/incoming-shipments/${id}`);
  },

  /**
   * Create a new incoming shipment
   */
  createIncomingShipment: async (data: CreateIncomingShipmentData): Promise<ApiResponse<IncomingShipmentWithItems>> => {
    return apiClient.post('/admin/incoming-shipments', data);
  },

  /**
   * Update an incoming shipment
   */
  updateIncomingShipment: async (
    id: string, 
    data: UpdateIncomingShipmentData
  ): Promise<ApiResponse<IncomingShipmentWithItems>> => {
    return apiClient.patch(`/admin/incoming-shipments/${id}`, data);
  },

  /**
   * Delete an incoming shipment
   */
  deleteIncomingShipment: async (id: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/admin/incoming-shipments/${id}`);
  },

  // ============================================================================
  // INCOMING SHIPMENT ITEMS
  // ============================================================================

  /**
   * Add an item to an incoming shipment
   */
  addIncomingShipmentItem: async (
    shipmentId: string, 
    data: Omit<CreateIncomingShipmentItemData, 'incomingShipmentId'>
  ): Promise<ApiResponse<any>> => {
    return apiClient.post(`/admin/incoming-shipments/${shipmentId}/items`, data);
  },

  /**
   * Update an incoming shipment item
   */
  updateIncomingShipmentItem: async (
    shipmentId: string,
    itemId: string,
    data: UpdateIncomingShipmentItemData
  ): Promise<ApiResponse<any>> => {
    return apiClient.patch(`/admin/incoming-shipments/${shipmentId}/items/${itemId}`, data);
  },

  /**
   * Delete an incoming shipment item
   */
  deleteIncomingShipmentItem: async (shipmentId: string, itemId: string): Promise<ApiResponse<void>> => {
    return apiClient.delete(`/admin/incoming-shipments/${shipmentId}/items/${itemId}`);
  },

  /**
   * Assign an incoming shipment item to a customer
   */
  assignItemToCustomer: async (
    shipmentId: string,
    itemId: string,
    data: {
      customerProfileId: string;
      assignmentReason?: string;
      notes?: string;
    }
  ): Promise<ApiResponse<any>> => {
    return apiClient.post(`/admin/incoming-shipments/${shipmentId}/items/${itemId}/assign`, data);
  },

  /**
   * Convert assigned incoming shipment item to package
   */
  convertItemToPackage: async (
    shipmentId: string,
    itemId: string,
    packageData?: Partial<CreatePackageData>
  ): Promise<ApiResponse<PackageWithDetails>> => {
    return apiClient.post(`/admin/incoming-shipments/${shipmentId}/items/${itemId}/convert`, packageData || {});
  },

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  /**
   * Bulk scan incoming shipment items
   */
  bulkScanItems: async (
    shipmentId: string,
    items: Array<{
      itemReference: string;
      scannedTrackingNumber?: string;
      estimatedWeight?: number;
      dimensions?: string;
      description?: string;
      senderInfo?: string;
    }>
  ): Promise<ApiResponse<{ created: number; failed: string[] }>> => {
    return apiClient.post(`/admin/incoming-shipments/${shipmentId}/bulk-scan`, { items });
  },

  /**
   * Bulk assign items to customers
   */
  bulkAssignItems: async (
    assignments: Array<{
      shipmentId: string;
      itemId: string;
      customerProfileId: string;
      assignmentReason?: string;
      notes?: string;
    }>
  ): Promise<ApiResponse<{ assigned: number; failed: string[] }>> => {
    return apiClient.post('/admin/incoming-shipments/bulk-assign', { assignments });
  },

  /**
   * Bulk convert assigned items to packages
   */
  bulkConvertToPackages: async (
    conversions: Array<{
      shipmentId: string;
      itemId: string;
      packageData?: Partial<CreatePackageData>;
    }>
  ): Promise<ApiResponse<{ converted: number; failed: string[] }>> => {
    return apiClient.post('/admin/incoming-shipments/bulk-convert', { conversions });
  },

  // ============================================================================
  // SEARCH AND FILTERING
  // ============================================================================

  /**
   * Search packages by various criteria
   */
  searchPackages: async (query: string, filters?: {
    status?: string;
    warehouseId?: string;
    limit?: number;
  }): Promise<ApiResponse<PackageWithDetails[]>> => {
    return apiClient.get('/admin/packages/search', {
      params: { q: query, ...filters }
    });
  },

  /**
   * Get packages by customer
   */
  getPackagesByCustomer: async (
    customerId: string, 
    filters: Omit<PackageFilters, 'customerId'> = {}
  ): Promise<PaginatedResponse<PackageWithDetails>> => {
    return apiClient.get(`/admin/customers/${customerId}/packages`, { params: filters });
  },

  /**
   * Get packages by warehouse
   */
  getPackagesByWarehouse: async (
    warehouseId: string, 
    filters: Omit<PackageFilters, 'warehouseId'> = {}
  ): Promise<PaginatedResponse<PackageWithDetails>> => {
    return apiClient.get(`/admin/warehouses/${warehouseId}/packages`, { params: filters });
  },
};