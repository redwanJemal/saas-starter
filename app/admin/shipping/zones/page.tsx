// app/admin/shipping/zones/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Globe, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

import { Zone, CreateZoneData } from '@/features/shipping/types/zone.types';
import { createZonesTableColumns } from '@/features/shipping/components/zones-table-columns';
import { CreateZoneDialog } from '@/features/shipping/components/create-zone-dialog';
import { EditZoneDialog } from '@/features/shipping/components/edit-zone-dialog';
import { DataTable } from '@/shared/components/data-table/data-table';

interface ZonesResponse {
  zones: Zone[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function ShippingZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 20;

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);

  useEffect(() => {
    fetchZones();
  }, [currentPage, searchTerm, statusFilter]);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const fetchZones = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('is_active', statusFilter);

      const response = await fetch(`/api/admin/shipping/zones?${params}`);
      if (!response.ok) throw new Error('Failed to fetch zones');

      const data: ZonesResponse = await response.json();
      setZones(data.zones || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalItems(data.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching zones:', error);
      setError('Failed to fetch shipping zones');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateZone = async (data: CreateZoneData) => {
    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch('/api/admin/shipping/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create zone');
      }

      setSuccess('Zone created successfully');
      fetchZones();
    } catch (error) {
      console.error('Error creating zone:', error);
      setError(error instanceof Error ? error.message : 'Failed to create zone');
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditZone = (zone: Zone) => {
    setEditingZone(zone);
    setIsEditDialogOpen(true);
  };

  const handleUpdateZone = async (data: CreateZoneData) => {
    if (!editingZone) return;

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`/api/admin/shipping/zones/${editingZone.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update zone');
      }

      setSuccess('Zone updated successfully');
      setEditingZone(null);
      fetchZones();
    } catch (error) {
      console.error('Error updating zone:', error);
      setError(error instanceof Error ? error.message : 'Failed to update zone');
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    try {
      setError(null);

      const response = await fetch(`/api/admin/shipping/zones/${zoneId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete zone');
      }

      setSuccess('Zone deleted successfully');
      fetchZones();
    } catch (error) {
      console.error('Error deleting zone:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete zone');
    }
  };

  const handlePaginationChange = (page: number) => {
    setCurrentPage(page);
  };

  const filteredZones = zones.filter(zone => {
    const matchesSearch = !searchTerm || 
      zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (zone.description && zone.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && zone.isActive) ||
      (statusFilter === 'inactive' && !zone.isActive);

    return matchesSearch && matchesStatus;
  });

  const columns = createZonesTableColumns(
    handleEditZone,
    handleDeleteZone
  );

  const filters = (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search zones..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="pl-10"
        />
      </div>
      
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="active">Active Only</SelectItem>
          <SelectItem value="inactive">Inactive Only</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const actions = (
    <div className="flex items-center gap-2">
      <CreateZoneDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateZone}
        isSubmitting={submitting}
      />
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipping Zones</h1>
          <p className="text-gray-600">Manage shipping zones and destination countries</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            {totalItems} zones
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            {zones.filter(z => z.isActive).length} active
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

      {/* Zones Table */}
      <Card>
        <CardHeader>
          <CardTitle>Shipping Zones ({totalItems})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredZones}
            searchKey="name"
            searchPlaceholder="Search zones..."
            isLoading={loading}
            loadingMessage="Loading shipping zones..."
            emptyMessage="No shipping zones found."
            onRefresh={fetchZones}
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

      {/* Edit Zone Dialog */}
      {editingZone && (
        <EditZoneDialog
          zone={editingZone}
          isOpen={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) setEditingZone(null);
          }}
          onSubmit={handleUpdateZone}
          isSubmitting={submitting}
        />
      )}
    </div>
  );
}