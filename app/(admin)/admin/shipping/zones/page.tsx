// app/admin/shipping/zones/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Globe, 
  MapPin,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface Zone {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  countryCount: number;
  createdAt: string;
  updatedAt: string;
  countries?: Array<{
    id: string;
    countryCode: string;
    createdAt: string;
  }>;
}

interface CreateZoneData {
  name: string;
  description: string;
  isActive: boolean;
  countries: string[];
}

// Common country codes for quick selection
const COMMON_COUNTRIES = [
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'QA', name: 'Qatar' },
  { code: 'BH', name: 'Bahrain' },
  { code: 'OM', name: 'Oman' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'PT', name: 'Portugal' },
  { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'SG', name: 'Singapore' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'JP', name: 'Japan' },
  { code: 'AU', name: 'Australia' },
];

export default function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  
  // Form states
  const [createForm, setCreateForm] = useState<CreateZoneData>({
    name: '',
    description: '',
    isActive: true,
    countries: [],
  });
  
  const [editForm, setEditForm] = useState<CreateZoneData>({
    name: '',
    description: '',
    isActive: true,
    countries: [],
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchZones();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchZones = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchTerm,
        status: statusFilter,
      });

      const response = await fetch(`/api/admin/zones?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch zones');
      }

      const data = await response.json();
      setZones(data.zones || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching zones:', error);
      setError('Failed to load zones');
    } finally {
      setLoading(false);
    }
  };

  const fetchZoneDetails = async (zoneId: string) => {
    try {
      const response = await fetch(`/api/admin/zones/${zoneId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch zone details');
      }

      const data = await response.json();
      return data.zone;
    } catch (error) {
      console.error('Error fetching zone details:', error);
      throw error;
    }
  };

  const handleCreateZone = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch('/api/admin/zones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create zone');
      }

      setSuccess('Zone created successfully');
      setIsCreateDialogOpen(false);
      setCreateForm({
        name: '',
        description: '',
        isActive: true,
        countries: [],
      });
      fetchZones();
    } catch (error) {
      console.error('Error creating zone:', error);
      setError(error instanceof Error ? error.message : 'Failed to create zone');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditZone = async () => {
    if (!editingZone) return;

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`/api/admin/zones/${editingZone.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update zone');
      }

      setSuccess('Zone updated successfully');
      setIsEditDialogOpen(false);
      setEditingZone(null);
      fetchZones();
    } catch (error) {
      console.error('Error updating zone:', error);
      setError(error instanceof Error ? error.message : 'Failed to update zone');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    if (!confirm('Are you sure you want to delete this zone? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/zones/${zoneId}`, {
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

  const openEditDialog = async (zone: Zone) => {
    try {
      const zoneDetails = await fetchZoneDetails(zone.id);
      setEditingZone(zoneDetails);
      setEditForm({
        name: zoneDetails.name,
        description: zoneDetails.description || '',
        isActive: zoneDetails.isActive,
        countries: zoneDetails.countries?.map((c: any) => c.countryCode) || [],
      });
      setIsEditDialogOpen(true);
    } catch (error) {
      setError('Failed to load zone details');
    }
  };

  const toggleCountry = (countryCode: string, isCreate: boolean = true) => {
    const form = isCreate ? createForm : editForm;
    const setForm = isCreate ? setCreateForm : setEditForm;
    
    const updatedCountries = form.countries.includes(countryCode)
      ? form.countries.filter(code => code !== countryCode)
      : [...form.countries, countryCode];
    
    setForm(prev => ({
      ...prev,
      countries: updatedCountries,
    }));
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Shipping Zones</h1>
          <p className="text-muted-foreground">
            Manage shipping zones and country assignments
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={clearMessages}>
              <Plus className="mr-2 h-4 w-4" />
              Create Zone
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Shipping Zone</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Zone Name *</Label>
                <Input
                  id="name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Middle East, Europe Zone 1"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description of this zone"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={createForm.isActive}
                  onCheckedChange={(checked) => 
                    setCreateForm(prev => ({ ...prev, isActive: !!checked }))
                  }
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              
              <div className="space-y-2">
                <Label>Countries</Label>
                <p className="text-sm text-muted-foreground">
                  Select countries that belong to this zone:
                </p>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded p-3">
                  {COMMON_COUNTRIES.map(country => (
                    <div key={country.code} className="flex items-center space-x-2">
                      <Checkbox
                        id={`create-${country.code}`}
                        checked={createForm.countries.includes(country.code)}
                        onCheckedChange={() => toggleCountry(country.code, true)}
                      />
                      <Label htmlFor={`create-${country.code}`} className="text-sm">
                        {country.code} - {country.name}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Selected: {createForm.countries.length} countries
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateZone}
                disabled={submitting || !createForm.name.trim()}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Zone'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
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
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Zones List */}
      <Card>
        <CardHeader>
          <CardTitle>Zones ({zones.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : zones.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No zones found</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Zone
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {zones.map((zone) => (
                <div key={zone.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{zone.name}</h3>
                      <Badge variant={zone.isActive ? 'default' : 'secondary'}>
                        {zone.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {zone.description && (
                      <p className="text-sm text-muted-foreground">{zone.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {zone.countryCount} countries
                      </span>
                      <span>Created {new Date(zone.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(zone)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteZone(zone.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Shipping Zone</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Zone Name *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Middle East, Europe Zone 1"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description of this zone"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-isActive"
                checked={editForm.isActive}
                onCheckedChange={(checked) => 
                  setEditForm(prev => ({ ...prev, isActive: !!checked }))
                }
              />
              <Label htmlFor="edit-isActive">Active</Label>
            </div>
            
            <div className="space-y-2">
              <Label>Countries</Label>
              <p className="text-sm text-muted-foreground">
                Select countries that belong to this zone:
              </p>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded p-3">
                {COMMON_COUNTRIES.map(country => (
                  <div key={country.code} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-${country.code}`}
                      checked={editForm.countries.includes(country.code)}
                      onCheckedChange={() => toggleCountry(country.code, false)}
                    />
                    <Label htmlFor={`edit-${country.code}`} className="text-sm">
                      {country.code} - {country.name}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Selected: {editForm.countries.length} countries
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditZone}
              disabled={submitting || !editForm.name.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Zone'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}