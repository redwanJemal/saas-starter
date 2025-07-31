// app/admin/shipping/rates/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, DollarSign, CheckCircle, AlertCircle, Truck } from 'lucide-react';

import { ShippingRate, CreateShippingRateData, SERVICE_TYPES } from '@/features/shipping/types/rate.types';
import { Zone } from '@/features/shipping/types/zone.types';
import { createRatesTableColumns } from '@/features/shipping/components/rates-table-columns';
import { CreateRateDialog } from '@/features/shipping/components/create-rate-dialog';
import { EditRateDialog } from '@/features/shipping/components/edit-rate-dialog';
import { DataTable } from '@/shared/components/data-table/data-table';

interface Warehouse {
  id: string;
  name: string;
  code: string;
  city: string;
  countryCode: string;
}

interface RatesResponse {
  rates: ShippingRate[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function ShippingRatesPage() {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 20;

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<ShippingRate | null>(null);

  useEffect(() => {
    fetchRates();
    fetchWarehouses();
    fetchZones();
  }, [currentPage, searchTerm, warehouseFilter, zoneFilter, serviceFilter, statusFilter]);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const fetchRates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });

      if (searchTerm) params.append('search', searchTerm);
      if (warehouseFilter !== 'all') params.append('warehouse_id', warehouseFilter);
      if (zoneFilter !== 'all') params.append('zone_id', zoneFilter);
      if (serviceFilter !== 'all') params.append('service_type', serviceFilter);
      if (statusFilter !== 'all') params.append('is_active', statusFilter);

      const response = await fetch(`/api/admin/shipping/rates?${params}`);
      if (!response.ok) throw new Error('Failed to fetch rates');

      const data: RatesResponse = await response.json();
      setRates(data.rates || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalItems(data.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching rates:', error);
      setError('Failed to fetch shipping rates');
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/admin/warehouses');
      if (!response.ok) throw new Error('Failed to fetch warehouses');

      const data = await response.json();
      setWarehouses(data.warehouses || []);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const fetchZones = async () => {
    try {
      const response = await fetch('/api/admin/shipping/zones');
      if (!response.ok) throw new Error('Failed to fetch zones');

      const data = await response.json();
      setZones(data.zones || []);
    } catch (error) {
      console.error('Error fetching zones:', error);
    }
  };

  const handleCreateRate = async (data: CreateShippingRateData) => {
    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch('/api/admin/shipping/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create rate');
      }

      setSuccess('Shipping rate created successfully');
      fetchRates();
    } catch (error) {
      console.error('Error creating rate:', error);
      setError(error instanceof Error ? error.message : 'Failed to create rate');
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditRate = (rate: ShippingRate) => {
    setEditingRate(rate);
    setIsEditDialogOpen(true);
  };

  const handleUpdateRate = async (data: CreateShippingRateData) => {
    if (!editingRate) return;

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`/api/admin/shipping/rates/${editingRate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update rate');
      }

      setSuccess('Shipping rate updated successfully');
      setEditingRate(null);
      fetchRates();
    } catch (error) {
      console.error('Error updating rate:', error);
      setError(error instanceof Error ? error.message : 'Failed to update rate');
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRate = async (rateId: string) => {
    try {
      setError(null);

      const response = await fetch(`/api/admin/shipping/rates/${rateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete rate');
      }

      setSuccess('Shipping rate deleted successfully');
      fetchRates();
    } catch (error) {
      console.error('Error deleting rate:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete rate');
    }
  };

  const handleToggleRateStatus = async (rateId: string, isActive: boolean) => {
    try {
      setError(null);

      const response = await fetch(`/api/admin/shipping/rates/${rateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update rate status');
      }

      setSuccess(`Rate ${isActive ? 'activated' : 'deactivated'} successfully`);
      fetchRates();
    } catch (error) {
      console.error('Error updating rate status:', error);
      setError(error instanceof Error ? error.message : 'Failed to update rate status');
    }
  };

  const handleDuplicateRate = (rate: ShippingRate) => {
    // Convert rate to create data format
    const duplicateData: CreateShippingRateData = {
      warehouseId: rate.warehouseId,
      zoneId: rate.zoneId,
      serviceType: rate.serviceType,
      baseRate: rate.baseRate,
      perKgRate: rate.perKgRate,
      minCharge: rate.minCharge,
      maxWeightKg: rate.maxWeightKg,
      currencyCode: rate.currencyCode,
      isActive: false, // Start as inactive
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveUntil: rate.effectiveUntil,
    };

    // Pre-fill create dialog with duplicate data
    setIsCreateDialogOpen(true);
  };

  const handlePaginationChange = (page: number) => {
    setCurrentPage(page);
  };

  const filteredRates = rates.filter(rate => {
    const matchesSearch = !searchTerm || 
      rate.warehouse?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rate.zone?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rate.serviceType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesWarehouse = warehouseFilter === 'all' || rate.warehouseId === warehouseFilter;
    const matchesZone = zoneFilter === 'all' || rate.zoneId === zoneFilter;
    const matchesService = serviceFilter === 'all' || rate.serviceType === serviceFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && rate.isActive) ||
      (statusFilter === 'inactive' && !rate.isActive);

    return matchesSearch && matchesWarehouse && matchesZone && matchesService && matchesStatus;
  });

  const columns = createRatesTableColumns(
    handleEditRate,
    handleDeleteRate,
    handleToggleRateStatus,
    handleDuplicateRate
  );

  const filters = (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search rates..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="pl-10"
        />
      </div>
      
      <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
        <SelectTrigger>
          <SelectValue placeholder="All Warehouses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Warehouses</SelectItem>
          {warehouses.map(warehouse => (
            <SelectItem key={warehouse.id} value={warehouse.id}>
              {warehouse.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select value={zoneFilter} onValueChange={setZoneFilter}>
        <SelectTrigger>
          <SelectValue placeholder="All Zones" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Zones</SelectItem>
          {zones.map(zone => (
            <SelectItem key={zone.id} value={zone.id}>
              {zone.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select value={serviceFilter} onValueChange={setServiceFilter}>
        <SelectTrigger>
          <SelectValue placeholder="All Services" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Services</SelectItem>
          {SERVICE_TYPES.map(service => (
            <SelectItem key={service.value} value={service.value}>
              {service.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger>
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active Only</SelectItem>
          <SelectItem value="inactive">Inactive Only</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const actions = (
    <div className="flex items-center gap-2">
      <CreateRateDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateRate}
        isSubmitting={submitting}
        warehouses={warehouses}
        zones={zones.filter(z => z.isActive)}
      />
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipping Rates</h1>
          <p className="text-gray-600">Manage shipping rates for zones and warehouses</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            {totalItems} rates
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            {rates.filter(r => r.isActive).length} active
          </Badge>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="default" className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Rates Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipping Rates ({totalItems})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredRates}
            searchKey="warehouse.name"
            searchPlaceholder="Search by warehouse or zone..."
            isLoading={loading}
            loadingMessage="Loading shipping rates..."
            emptyMessage="No shipping rates found."
            onRefresh={fetchRates}
            pagination={{
              page: currentPage,
              total: totalItems,
              limit,
              pages: totalPages,
            }}
            onPaginationChange={handlePaginationChange}
            filters={filters}
            actions={actions}
          />
        </CardContent>
      </Card>

      {/* Edit Rate Dialog */}
      {editingRate && (
        <EditRateDialog
          rate={editingRate}
          isOpen={isEditDialogOpen}
          onOpenChange={(open: boolean) => {
            setIsEditDialogOpen(open);
            if (!open) setEditingRate(null);
          }}
          onSubmit={handleUpdateRate}
          isSubmitting={submitting}
          warehouses={warehouses}
          zones={zones.filter(z => z.isActive)}
        />
      )}
    </div>
  );
}