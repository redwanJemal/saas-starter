// app/admin/shipping/rates/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Edit, Trash2, DollarSign, Globe, Warehouse, Truck, AlertCircle, CheckCircle, Loader2, MoreHorizontal, Calendar } from 'lucide-react';

interface ShippingRate {
  id: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  zoneId: string;
  zoneName: string;
  serviceType: 'standard' | 'express' | 'economy';
  baseRate: number;
  perKgRate: number;
  minCharge: number;
  maxWeightKg?: number;
  currencyCode: string;
  isActive: boolean;
  effectiveFrom: string;
  effectiveUntil?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateRateData {
  warehouseId: string;
  zoneId: string;
  serviceType: 'standard' | 'express' | 'economy';
  baseRate: string;
  perKgRate: string;
  minCharge: string;
  maxWeightKg: string;
  currencyCode: string;
  isActive: boolean;
  effectiveFrom: string;
  effectiveUntil: string;
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
  city: string;
  countryCode: string;
}

interface Zone {
  id: string;
  name: string;
  description?: string;
  countryCount: number;
  isActive: boolean;
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

  // Form state
  const [createForm, setCreateForm] = useState<CreateRateData>({
    warehouseId: '',
    zoneId: '',
    serviceType: 'standard',
    baseRate: '',
    perKgRate: '',
    minCharge: '',
    maxWeightKg: '',
    currencyCode: 'USD',
    isActive: true,
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveUntil: '',
  });

  const [editForm, setEditForm] = useState<CreateRateData>({
    warehouseId: '',
    zoneId: '',
    serviceType: 'standard',
    baseRate: '',
    perKgRate: '',
    minCharge: '',
    maxWeightKg: '',
    currencyCode: 'USD',
    isActive: true,
    effectiveFrom: '',
    effectiveUntil: '',
  });

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

      const response = await fetch(`/api/admin/shipping-rates?${params}`);
      if (!response.ok) throw new Error('Failed to fetch rates');

      const data = await response.json();
      setRates(data.rates || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalItems(data.pagination?.totalItems || 0);
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
      const response = await fetch('/api/admin/zones');
      if (!response.ok) throw new Error('Failed to fetch zones');
      const data = await response.json();
      setZones(data.zones || []);
    } catch (error) {
      console.error('Error fetching zones:', error);
    }
  };

  const handleCreateRate = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Validate form
      if (!createForm.warehouseId || !createForm.zoneId || !createForm.baseRate || 
          !createForm.perKgRate || !createForm.minCharge || !createForm.effectiveFrom) {
        throw new Error('Please fill in all required fields');
      }

      const response = await fetch('/api/admin/shipping-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          baseRate: parseFloat(createForm.baseRate),
          perKgRate: parseFloat(createForm.perKgRate),
          minCharge: parseFloat(createForm.minCharge),
          maxWeightKg: createForm.maxWeightKg ? parseFloat(createForm.maxWeightKg) : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create rate');
      }

      setSuccess('Shipping rate created successfully');
      setIsCreateDialogOpen(false);
      resetCreateForm();
      fetchRates();
    } catch (error) {
      console.error('Error creating rate:', error);
      setError(error instanceof Error ? error.message : 'Failed to create rate');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditRate = async () => {
    if (!editingRate) return;

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`/api/admin/shipping-rates/${editingRate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          baseRate: parseFloat(editForm.baseRate),
          perKgRate: parseFloat(editForm.perKgRate),
          minCharge: parseFloat(editForm.minCharge),
          maxWeightKg: editForm.maxWeightKg ? parseFloat(editForm.maxWeightKg) : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update rate');
      }

      setSuccess('Shipping rate updated successfully');
      setIsEditDialogOpen(false);
      setEditingRate(null);
      fetchRates();
    } catch (error) {
      console.error('Error updating rate:', error);
      setError(error instanceof Error ? error.message : 'Failed to update rate');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRate = async (rateId: string) => {
    if (!confirm('Are you sure you want to delete this shipping rate? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/shipping-rates/${rateId}`, {
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

  const openEditDialog = (rate: ShippingRate) => {
    setEditingRate(rate);
    setEditForm({
      warehouseId: rate.warehouseId,
      zoneId: rate.zoneId,
      serviceType: rate.serviceType,
      baseRate: rate.baseRate.toString(),
      perKgRate: rate.perKgRate.toString(),
      minCharge: rate.minCharge.toString(),
      maxWeightKg: rate.maxWeightKg?.toString() || '',
      currencyCode: rate.currencyCode,
      isActive: rate.isActive,
      effectiveFrom: rate.effectiveFrom,
      effectiveUntil: rate.effectiveUntil || '',
    });
    setIsEditDialogOpen(true);
  };

  const resetCreateForm = () => {
    setCreateForm({
      warehouseId: '',
      zoneId: '',
      serviceType: 'standard',
      baseRate: '',
      perKgRate: '',
      minCharge: '',
      maxWeightKg: '',
      currencyCode: 'USD',
      isActive: true,
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveUntil: '',
    });
  };

  const columns: ColumnDef<ShippingRate>[] = [
    {
      accessorKey: 'warehouseName',
      header: 'Warehouse',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium">{row.original.warehouseName}</div>
          <div className="text-sm text-muted-foreground">{row.original.warehouseCode}</div>
        </div>
      ),
    },
    {
      accessorKey: 'zoneName',
      header: 'Zone',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.zoneName}</span>
        </div>
      ),
    },
    {
      accessorKey: 'serviceType',
      header: 'Service',
      cell: ({ row }) => {
        const serviceType = row.original.serviceType;
        const variant = serviceType === 'express' ? 'default' : 
                      serviceType === 'standard' ? 'secondary' : 'outline';
        return (
          <Badge variant={variant} className="capitalize">
            {serviceType}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'baseRate',
      header: 'Base Rate',
      cell: ({ row }) => (
        <div className="font-mono">
          {row.original.currencyCode} {row.original.baseRate.toFixed(2)}
        </div>
      ),
    },
    {
      accessorKey: 'perKgRate',
      header: 'Per KG',
      cell: ({ row }) => (
        <div className="font-mono">
          {row.original.currencyCode} {row.original.perKgRate.toFixed(2)}
        </div>
      ),
    },
    {
      accessorKey: 'minCharge',
      header: 'Min Charge',
      cell: ({ row }) => (
        <div className="font-mono">
          {row.original.currencyCode} {row.original.minCharge.toFixed(2)}
        </div>
      ),
    },
    {
      accessorKey: 'effectiveFrom',
      header: 'Effective',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="text-sm">From: {new Date(row.original.effectiveFrom).toLocaleDateString()}</div>
          {row.original.effectiveUntil && (
            <div className="text-sm text-muted-foreground">
              Until: {new Date(row.original.effectiveUntil).toLocaleDateString()}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
          {row.original.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEditDialog(row.original)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDeleteRate(row.original.id)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const filteredRates = rates.filter(rate => {
    const matchesSearch = searchTerm === '' ||
      rate.warehouseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rate.zoneName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rate.serviceType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesWarehouse = warehouseFilter === 'all' || rate.warehouseId === warehouseFilter;
    const matchesZone = zoneFilter === 'all' || rate.zoneId === zoneFilter;
    const matchesService = serviceFilter === 'all' || rate.serviceType === serviceFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && rate.isActive) ||
      (statusFilter === 'inactive' && !rate.isActive);

    return matchesSearch && matchesWarehouse && matchesZone && matchesService && matchesStatus;
  });

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

      {/* Create Rate Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Shipping Rate
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Shipping Rate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-warehouse">Warehouse *</Label>
                <Select 
                  value={createForm.warehouseId} 
                  onValueChange={(value) => setCreateForm(prev => ({ ...prev, warehouseId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(warehouse => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} ({warehouse.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-zone">Zone *</Label>
                <Select 
                  value={createForm.zoneId} 
                  onValueChange={(value) => setCreateForm(prev => ({ ...prev, zoneId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {zones.filter(z => z.isActive).map(zone => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-service">Service Type *</Label>
                <Select 
                  value={createForm.serviceType} 
                  onValueChange={(value: 'standard' | 'express' | 'economy') => 
                    setCreateForm(prev => ({ ...prev, serviceType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="economy">Economy</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="express">Express</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-currency">Currency</Label>
                <Select 
                  value={createForm.currencyCode} 
                  onValueChange={(value) => setCreateForm(prev => ({ ...prev, currencyCode: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-baseRate">Base Rate *</Label>
                <Input
                  id="create-baseRate"
                  type="number"
                  step="0.01"
                  value={createForm.baseRate}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, baseRate: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-perKgRate">Per KG Rate *</Label>
                <Input
                  id="create-perKgRate"
                  type="number"
                  step="0.01"
                  value={createForm.perKgRate}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, perKgRate: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-minCharge">Min Charge *</Label>
                <Input
                  id="create-minCharge"
                  type="number"
                  step="0.01"
                  value={createForm.minCharge}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, minCharge: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-maxWeight">Max Weight (KG)</Label>
              <Input
                id="create-maxWeight"
                type="number"
                step="0.1"
                value={createForm.maxWeightKg}
                onChange={(e) => setCreateForm(prev => ({ ...prev, maxWeightKg: e.target.value }))}
                placeholder="Optional weight limit"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-effectiveFrom">Effective From *</Label>
                <Input
                  id="create-effectiveFrom"
                  type="date"
                  value={createForm.effectiveFrom}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, effectiveFrom: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-effectiveUntil">Effective Until</Label>
                <Input
                  id="create-effectiveUntil"
                  type="date"
                  value={createForm.effectiveUntil}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, effectiveUntil: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateRate} 
              disabled={submitting || !createForm.warehouseId || !createForm.zoneId || !createForm.baseRate}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Rate'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
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
                <SelectItem value="economy">Economy</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="express">Express</SelectItem>
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
        </CardContent>
      </Card>

      {/* Rates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Shipping Rates ({totalItems})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredRates}
            searchKey="warehouseName"
            searchPlaceholder="Search by warehouse or zone..."
            isLoading={loading}
            loadingMessage="Loading shipping rates..."
            emptyMessage="No shipping rates found."
            onRefresh={fetchRates}
            pagination={{
              page: currentPage,
              limit,
              total: totalItems,
              pages: totalPages,
            }}
            onPaginationChange={(page) => setCurrentPage(page)}
          />
        </CardContent>
      </Card>

      {/* Edit Rate Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Shipping Rate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-warehouse">Warehouse *</Label>
                <Select 
                  value={editForm.warehouseId} 
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, warehouseId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(warehouse => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} ({warehouse.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-zone">Zone *</Label>
                <Select 
                  value={editForm.zoneId} 
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, zoneId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {zones.filter(z => z.isActive).map(zone => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-service">Service Type *</Label>
                <Select 
                  value={editForm.serviceType} 
                  onValueChange={(value: 'standard' | 'express' | 'economy') => 
                    setEditForm(prev => ({ ...prev, serviceType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="economy">Economy</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="express">Express</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-currency">Currency</Label>
                <Select 
                  value={editForm.currencyCode} 
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, currencyCode: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-baseRate">Base Rate *</Label>
                <Input
                  id="edit-baseRate"
                  type="number"
                  step="0.01"
                  value={editForm.baseRate}
                  onChange={(e) => setEditForm(prev => ({ ...prev, baseRate: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-perKgRate">Per KG Rate *</Label>
                <Input
                  id="edit-perKgRate"
                  type="number"
                  step="0.01"
                  value={editForm.perKgRate}
                  onChange={(e) => setEditForm(prev => ({ ...prev, perKgRate: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-minCharge">Min Charge *</Label>
                <Input
                  id="edit-minCharge"
                  type="number"
                  step="0.01"
                  value={editForm.minCharge}
                  onChange={(e) => setEditForm(prev => ({ ...prev, minCharge: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-maxWeight">Max Weight (KG)</Label>
              <Input
                id="edit-maxWeight"
                type="number"
                step="0.1"
                value={editForm.maxWeightKg}
                onChange={(e) => setEditForm(prev => ({ ...prev, maxWeightKg: e.target.value }))}
                placeholder="Optional weight limit"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-effectiveFrom">Effective From *</Label>
                <Input
                  id="edit-effectiveFrom"
                  type="date"
                  value={editForm.effectiveFrom}
                  onChange={(e) => setEditForm(prev => ({ ...prev, effectiveFrom: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-effectiveUntil">Effective Until</Label>
                <Input
                  id="edit-effectiveUntil"
                  type="date"
                  value={editForm.effectiveUntil}
                  onChange={(e) => setEditForm(prev => ({ ...prev, effectiveUntil: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-isActive"
                checked={editForm.isActive}
                onChange={(e) => setEditForm(prev => ({ ...prev, isActive: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="edit-isActive">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleEditRate} 
              disabled={submitting || !editForm.warehouseId || !editForm.zoneId || !editForm.baseRate}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Rate'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}