// app/admin/warehouses/[id]/components/bin-locations-tab.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { 
  Plus, 
  Edit, 
  MoreHorizontal, 
  Package, 
  MapPin, 
  Settings, 
  Thermometer, 
  Shield, 
  Eye,
  Trash2,
  Search
} from 'lucide-react';

interface BinLocation {
  id: string;
  binCode: string;
  zoneName: string;
  description?: string;
  maxCapacity: number;
  currentOccupancy: number;
  maxWeightKg?: number;
  dailyPremium: number;
  currency: string;
  isClimateControlled: boolean;
  isSecured: boolean;
  isAccessible: boolean;
  isActive: boolean;
  availableCapacity: number;
  createdAt: string;
  updatedAt: string;
}

interface BinLocationsTabProps {
  warehouseId: string;
}

export default function BinLocationsTab({ warehouseId }: BinLocationsTabProps) {
  const [binLocations, setBinLocations] = useState<BinLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingBin, setEditingBin] = useState<BinLocation | null>(null);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    binCode: '',
    zoneName: '',
    description: '',
    maxCapacity: '10',
    maxWeightKg: '',
    dailyPremium: '0.00',
    isClimateControlled: false,
    isSecured: false,
    isAccessible: true,
    isActive: true
  });

  useEffect(() => {
    fetchBinLocations();
  }, [warehouseId]);

  const fetchBinLocations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/bin-locations?warehouseId=${warehouseId}`);
      if (!response.ok) throw new Error('Failed to fetch bin locations');
      
      const data = await response.json();
      setBinLocations(data.binLocations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bin locations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBin = async () => {
    try {
      const payload = {
        ...formData,
        warehouseId,
        maxCapacity: parseInt(formData.maxCapacity) || 1,
        maxWeightKg: formData.maxWeightKg ? parseFloat(formData.maxWeightKg) : null,
        dailyPremium: parseFloat(formData.dailyPremium) || 0,
        isClimateControlled: Boolean(formData.isClimateControlled),
        isSecured: Boolean(formData.isSecured),
        isAccessible: Boolean(formData.isAccessible),
        isActive: Boolean(formData.isActive)
      };

      const response = await fetch('/api/admin/bin-locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create bin location');
      }

      setShowCreateDialog(false);
      resetForm();
      await fetchBinLocations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create bin location');
    }
  };

  const handleEditBin = async () => {
    if (!editingBin) return;

    try {
      const payload = {
        ...formData,
        maxCapacity: parseInt(formData.maxCapacity) || 1,
        maxWeightKg: formData.maxWeightKg ? parseFloat(formData.maxWeightKg) : null,
        dailyPremium: parseFloat(formData.dailyPremium) || 0,
        isClimateControlled: Boolean(formData.isClimateControlled),
        isSecured: Boolean(formData.isSecured),
        isAccessible: Boolean(formData.isAccessible),
        isActive: Boolean(formData.isActive)
      };

      const response = await fetch(`/api/admin/bin-locations/${editingBin.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update bin location');
      }

      setEditingBin(null);
      resetForm();
      await fetchBinLocations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update bin location');
    }
  };

  const resetForm = () => {
    setFormData({
      binCode: '',
      zoneName: '',
      description: '',
      maxCapacity: '10',
      maxWeightKg: '',
      dailyPremium: '0.00',
      isClimateControlled: false,
      isSecured: false,
      isAccessible: true,
      isActive: true
    });
  };

  const openEditDialog = (bin: BinLocation) => {
    setEditingBin(bin);
    setFormData({
      binCode: bin.binCode,
      zoneName: bin.zoneName,
      description: bin.description || '',
      maxCapacity: bin.maxCapacity.toString(),
      maxWeightKg: bin.maxWeightKg?.toString() || '',
      dailyPremium: bin.dailyPremium.toString(),
      isClimateControlled: bin.isClimateControlled,
      isSecured: bin.isSecured,
      isAccessible: bin.isAccessible,
      isActive: bin.isActive
    });
  };

  const getOccupancyBadge = (bin: BinLocation) => {
    const occupancyRate = (bin.currentOccupancy / bin.maxCapacity) * 100;
    
    if (occupancyRate >= 100) {
      return <Badge variant="destructive">Full</Badge>;
    } else if (occupancyRate >= 80) {
      return <Badge variant="secondary">Nearly Full ({bin.currentOccupancy}/{bin.maxCapacity})</Badge>;
    } else {
      return <Badge variant="outline">{bin.currentOccupancy}/{bin.maxCapacity}</Badge>;
    }
  };

  const filteredBinLocations = binLocations.filter(bin =>
    bin.binCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bin.zoneName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: ColumnDef<BinLocation>[] = [
    {
      accessorKey: 'binCode',
      header: 'Bin Code',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="p-1 bg-blue-100 rounded">
            <MapPin className="h-3 w-3 text-blue-600" />
          </div>
          <span className="font-medium">{row.original.binCode}</span>
        </div>
      ),
    },
    {
      accessorKey: 'zoneName',
      header: 'Zone',
    },
    {
      accessorKey: 'occupancy',
      header: 'Occupancy',
      cell: ({ row }) => getOccupancyBadge(row.original),
    },
    {
      accessorKey: 'features',
      header: 'Features',
      cell: ({ row }) => (
        <div className="flex gap-1">
          {row.original.isClimateControlled && (
            <Badge variant="outline" className="text-xs">
              <Thermometer className="h-3 w-3 mr-1" />
              Climate
            </Badge>
          )}
          {row.original.isSecured && (
            <Badge variant="outline" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Secured
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'dailyPremium',
      header: 'Daily Premium',
      cell: ({ row }) => {
        const premium = parseFloat(row.original.dailyPremium.toString());
        return premium > 0 ? `$${premium.toFixed(2)}` : 'Free';
      },
    },
    {
      accessorKey: 'status',
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
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEditDialog(row.original)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              View Packages
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Bin Locations</h2>
          <p className="text-sm text-gray-600">Manage storage locations in this warehouse</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingBin(null); }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Bin Location
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingBin ? 'Edit Bin Location' : 'Create New Bin Location'}
              </DialogTitle>
            </DialogHeader>
            <BinLocationForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={editingBin ? handleEditBin : handleCreateBin}
              onCancel={() => {
                setShowCreateDialog(false);
                setEditingBin(null);
                resetForm();
              }}
              isEditing={!!editingBin}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search bin locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Bins</p>
                <p className="text-2xl font-bold">{binLocations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Available Capacity</p>
                <p className="text-2xl font-bold">
                  {binLocations.reduce((sum, bin) => {
                    const capacity = Number(bin.availableCapacity) || 0;
                    return sum + capacity;
                  }, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Thermometer className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Climate Controlled</p>
                <p className="text-2xl font-bold">
                  {binLocations.filter(bin => bin.isClimateControlled).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Secured</p>
                <p className="text-2xl font-bold">
                  {binLocations.filter(bin => bin.isSecured).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bin Locations Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filteredBinLocations}
            searchKey="binCode"
          />
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingBin} onOpenChange={(open) => !open && setEditingBin(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Bin Location</DialogTitle>
          </DialogHeader>
          <BinLocationForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleEditBin}
            onCancel={() => {
              setEditingBin(null);
              resetForm();
            }}
            isEditing={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Separate form component for better organization
interface BinLocationFormProps {
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isEditing: boolean;
}

function BinLocationForm({ formData, setFormData, onSubmit, onCancel, isEditing }: BinLocationFormProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="binCode">Bin Code *</Label>
          <Input
            id="binCode"
            value={formData.binCode}
            onChange={(e) => setFormData({ ...formData, binCode: e.target.value.toUpperCase() })}
            placeholder="e.g., A1, B3, C12"
            className="uppercase"
          />
        </div>
        
        <div>
          <Label htmlFor="zoneName">Zone Name *</Label>
          <Input
            id="zoneName"
            value={formData.zoneName}
            onChange={(e) => setFormData({ ...formData, zoneName: e.target.value })}
            placeholder="e.g., Zone A, Premium, Standard"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Optional description of this bin location"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="maxCapacity">Max Capacity *</Label>
          <Input
            id="maxCapacity"
            type="number"
            min="1"
            value={formData.maxCapacity}
            onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
          />
        </div>
        
        <div>
          <Label htmlFor="maxWeightKg">Max Weight (kg)</Label>
          <Input
            id="maxWeightKg"
            type="number"
            step="0.001"
            value={formData.maxWeightKg}
            onChange={(e) => setFormData({ ...formData, maxWeightKg: e.target.value })}
            placeholder="Optional"
          />
        </div>
        
        <div>
          <Label htmlFor="dailyPremium">Daily Premium ($)</Label>
          <Input
            id="dailyPremium"
            type="number"
            step="0.01"
            value={formData.dailyPremium}
            onChange={(e) => setFormData({ ...formData, dailyPremium: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Features</h4>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="isClimateControlled"
            checked={formData.isClimateControlled}
            onCheckedChange={(checked) => setFormData({ ...formData, isClimateControlled: checked })}
          />
          <Label htmlFor="isClimateControlled">Climate Controlled</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="isSecured"
            checked={formData.isSecured}
            onCheckedChange={(checked) => setFormData({ ...formData, isSecured: checked })}
          />
          <Label htmlFor="isSecured">Secured Location</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="isAccessible"
            checked={formData.isAccessible}
            onCheckedChange={(checked) => setFormData({ ...formData, isAccessible: checked })}
          />
          <Label htmlFor="isAccessible">Easily Accessible</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit}>
          {isEditing ? 'Update' : 'Create'} Bin Location
        </Button>
      </div>
    </div>
  );
}