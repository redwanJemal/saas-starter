// features/shipping/hooks/use-shipping-query.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-keys';
import { shippingApi } from '../services/shipping-api';
import type {
  ZoneFilters,
  CreateZoneData,
  UpdateZoneData,
  ShippingRateFilters,
  CreateShippingRateData,
  UpdateShippingRateData,
  ShipmentFilters,
  CreateShipmentData,
  UpdateShipmentData,
  CreateShipmentTrackingEventData,
  RateCalculationRequest,
  BulkShipmentUpdateData,
} from '../types/shipping.types';
import { toast } from 'sonner';

// ============================================================================
// ZONE HOOKS
// ============================================================================

export const useZones = (filters: ZoneFilters = {}) => {
  return useQuery({
    queryKey: queryKeys.shipping.zones.list(filters),
    queryFn: () => shippingApi.getZones(filters),
    select: (data) => data, // Return full response with data and pagination
  });
};

export const useZone = (id: string) => {
  return useQuery({
    queryKey: queryKeys.shipping.zones.detail(id),
    queryFn: () => shippingApi.getZone(id),
    select: (data) => data.data,
    enabled: !!id,
  });
};

export const useCreateZone = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateZoneData) => shippingApi.createZone(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipping.zones.all });
      toast.success('Zone created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create zone');
    },
  });
};

export const useUpdateZone = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateZoneData }) => 
      shippingApi.updateZone(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipping.zones.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.shipping.zones.detail(id) });
      toast.success('Zone updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update zone');
    },
  });
};

export const useDeleteZone = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => shippingApi.deleteZone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipping.zones.all });
      toast.success('Zone deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete zone');
    },
  });
};

// ============================================================================
// SHIPPING RATE HOOKS
// ============================================================================

export const useShippingRates = (filters: ShippingRateFilters = {}) => {
  return useQuery({
    queryKey: queryKeys.shipping.rates.list(filters),
    queryFn: () => shippingApi.getShippingRates(filters),
    select: (data) => data, // Return full response with data and pagination
  });
};

export const useShippingRate = (id: string) => {
  return useQuery({
    queryKey: queryKeys.shipping.rates.detail(id),
    queryFn: () => shippingApi.getShippingRate(id),
    select: (data) => data.data,
    enabled: !!id,
  });
};

export const useCalculateRates = () => {
  return useMutation({
    mutationFn: (data: RateCalculationRequest) => shippingApi.calculateRates(data),
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to calculate shipping rates');
    },
  });
};

export const useActiveRatesForZone = (zoneId: string, warehouseId?: string) => {
  return useQuery({
    queryKey: queryKeys.shipping.rates.zone(zoneId, warehouseId),
    queryFn: () => shippingApi.getActiveRatesForZone(zoneId, warehouseId),
    select: (data) => data.data,
    enabled: !!zoneId,
  });
};

export const useCreateShippingRate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateShippingRateData) => shippingApi.createShippingRate(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipping.rates.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.shipping.statistics() });
      toast.success('Shipping rate created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create shipping rate');
    },
  });
};

export const useUpdateShippingRate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateShippingRateData }) => 
      shippingApi.updateShippingRate(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipping.rates.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.shipping.rates.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.shipping.statistics() });
      toast.success('Shipping rate updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update shipping rate');
    },
  });
};

export const useDeleteShippingRate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => shippingApi.deleteShippingRate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipping.rates.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.shipping.statistics() });
      toast.success('Shipping rate deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete shipping rate');
    },
  });
};

// ============================================================================
// SHIPMENT HOOKS
// ============================================================================

export const useShipments = (filters: ShipmentFilters = {}) => {
  return useQuery({
    queryKey: queryKeys.shipping.shipments.list(filters),
    queryFn: () => shippingApi.getShipments(filters),
    select: (data) => data, // Return full response with data and pagination
  });
};

export const useShipment = (id: string) => {
  return useQuery({
    queryKey: queryKeys.shipping.shipments.detail(id),
    queryFn: () => shippingApi.getShipment(id),
    select: (data) => data.data,
    enabled: !!id,
  });
};

export const useShippingStatistics = () => {
  return useQuery({
    queryKey: queryKeys.shipping.statistics(),
    queryFn: () => shippingApi.getShipmentStatistics(),
    select: (data) => data.data,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useCreateShipment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateShipmentData) => shippingApi.createShipment(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipping.shipments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.shipping.statistics() });
      toast.success('Shipment created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create shipment');
    },
  });
};

export const useUpdateShipment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateShipmentData }) => 
      shippingApi.updateShipment(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipping.shipments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.shipping.shipments.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.shipping.statistics() });
      toast.success('Shipment updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update shipment');
    },
  });
};

export const useUpdateShipmentStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) => 
      shippingApi.updateShipmentStatus(id, status, notes),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipping.shipments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.shipping.shipments.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.shipping.statistics() });
      toast.success('Shipment status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update shipment status');
    },
  });
};

export const useBulkUpdateShipments = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: BulkShipmentUpdateData) => shippingApi.bulkUpdateShipments(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipping.shipments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.shipping.statistics() });
      toast.success(`Successfully updated ${response.data.updated} shipments`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update shipments');
    },
  });
};

export const useDeleteShipment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => shippingApi.deleteShipment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipping.shipments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.shipping.statistics() });
      toast.success('Shipment deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete shipment');
    },
  });
};

// ============================================================================
// SHIPMENT PACKAGE MANAGEMENT HOOKS
// ============================================================================

export const useAddPackageToShipment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ shipmentId, packageId, data }: { 
      shipmentId: string; 
      packageId: string; 
      data?: { declaredValue?: string; declaredDescription?: string } 
    }) => shippingApi.addPackageToShipment(shipmentId, packageId, data),
    onSuccess: (response, { shipmentId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipping.shipments.detail(shipmentId) });
      toast.success('Package added to shipment successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to add package to shipment');
    },
  });
};

export const useRemovePackageFromShipment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ shipmentId, packageId }: { shipmentId: string; packageId: string }) => 
      shippingApi.removePackageFromShipment(shipmentId, packageId),
    onSuccess: (response, { shipmentId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipping.shipments.detail(shipmentId) });
      toast.success('Package removed from shipment successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to remove package from shipment');
    },
  });
};

// ============================================================================
// TRACKING HOOKS
// ============================================================================

export const useCreateTrackingEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateShipmentTrackingEventData) => shippingApi.createTrackingEvent(data),
    onSuccess: (response, { shipmentId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipping.shipments.detail(shipmentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.shipping.tracking.events(shipmentId) });
      toast.success('Tracking event created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create tracking event');
    },
  });
};

export const useShipmentTrackingEvents = (shipmentId: string) => {
  return useQuery({
    queryKey: queryKeys.shipping.tracking.events(shipmentId),
    queryFn: () => shippingApi.getShipmentTrackingEvents(shipmentId),
    select: (data) => data.data,
    enabled: !!shipmentId,
  });
};

export const useShipmentStatusHistory = (shipmentId: string) => {
  return useQuery({
    queryKey: queryKeys.shipping.tracking.statusHistory(shipmentId),
    queryFn: () => shippingApi.getShipmentStatusHistory(shipmentId),
    select: (data) => data.data,
    enabled: !!shipmentId,
  });
};

// ============================================================================
// UTILITY HOOKS
// ============================================================================

export const useSearchZones = (query: string) => {
  return useQuery({
    queryKey: queryKeys.shipping.zones.search(query),
    queryFn: () => shippingApi.searchZones(query),
    select: (data) => data.data,
    enabled: query.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAvailableCarriers = () => {
  return useQuery({
    queryKey: queryKeys.shipping.carriers(),
    queryFn: () => shippingApi.getAvailableCarriers(),
    select: (data) => data.data,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useServiceTypes = () => {
  return useQuery({
    queryKey: queryKeys.shipping.serviceTypes(),
    queryFn: () => shippingApi.getServiceTypes(),
    select: (data) => data.data,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};