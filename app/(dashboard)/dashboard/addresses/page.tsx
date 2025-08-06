// app/(dashboard)/dashboard/addresses/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  Copy, 
  Star, 
  Home, 
  Building, 
  User, 
  Mail, 
  Phone, 
  Loader2, 
  CheckCircle, 
  X,
  Search,
  Filter,
  AlertCircle,
  Globe,
  Navigation
} from 'lucide-react';
import { AddressesSkeleton } from '@/components/loading/skeleton-components';

interface Address {
  id: string;
  addressType: 'shipping' | 'billing';
  name: string;
  companyName?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateProvince?: string;
  postalCode: string;
  countryCode: string;
  phone?: string;
  email?: string;
  deliveryInstructions?: string;
  isDefault: boolean;
  isVerified: boolean;
  verificationMethod?: string;
  createdAt: string;
  updatedAt: string;
}

interface Country {
  id: string;
  code: string;
  name: string;
  region?: string;
  callingCode?: string;
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  // Search and filter states
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  
  // Form state
  const [addressForm, setAddressForm] = useState({
    addressType: 'shipping' as 'shipping' | 'billing',
    name: '',
    companyName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    stateProvince: '',
    postalCode: '',
    countryCode: '',
    phone: '',
    email: '',
    deliveryInstructions: '',
    isDefault: false,
  });

  // Error and success states
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch addresses
  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/customer/addresses');
      if (response.ok) {
        const data = await response.json();
        setAddresses(data);
      } else {
        setError('Failed to fetch addresses');
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setError('Failed to fetch addresses');
    } finally {
      setLoading(false);
    }
  };

  // Fetch countries
  const fetchCountries = async () => {
    try {
      const response = await fetch('/api/admin/master-data/countries');
      if (response.ok) {
        const data = await response.json();
        setCountries(data.countries);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
    }
  };

  useEffect(() => {
    fetchAddresses();
    fetchCountries();
  }, []);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Reset form
  const resetForm = () => {
    setAddressForm({
      addressType: 'shipping',
      name: '',
      companyName: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      stateProvince: '',
      postalCode: '',
      countryCode: '',
      phone: '',
      email: '',
      deliveryInstructions: '',
      isDefault: false,
    });
  };

  // Handle create address
  const handleCreateAddress = async () => {
    if (!addressForm.name || !addressForm.addressLine1 || !addressForm.city || !addressForm.postalCode || !addressForm.countryCode) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      const response = await fetch('/api/customer/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressForm),
      });

      if (response.ok) {
        await fetchAddresses();
        setIsCreateDialogOpen(false);
        resetForm();
        setSuccess('Address created successfully');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create address');
      }
    } catch (error) {
      console.error('Error creating address:', error);
      setError('Failed to create address');
    } finally {
      setSaving(false);
    }
  };

  // Handle edit address
  const handleEditAddress = async () => {
    if (!editingAddress || !addressForm.name || !addressForm.addressLine1 || !addressForm.city || !addressForm.postalCode || !addressForm.countryCode) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      const response = await fetch(`/api/customer/addresses/${editingAddress.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressForm),
      });

      if (response.ok) {
        await fetchAddresses();
        setIsEditDialogOpen(false);
        setEditingAddress(null);
        resetForm();
        setSuccess('Address updated successfully');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update address');
      }
    } catch (error) {
      console.error('Error updating address:', error);
      setError('Failed to update address');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete address
  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      setDeleting(addressId);
      setError(null);
      
      const response = await fetch(`/api/customer/addresses/${addressId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchAddresses();
        setSuccess('Address deleted successfully');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete address');
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      setError('Failed to delete address');
    } finally {
      setDeleting(null);
    }
  };

  // Open edit dialog
  const openEditDialog = (address: Address) => {
    setEditingAddress(address);
    setAddressForm({
      addressType: address.addressType,
      name: address.name,
      companyName: address.companyName || '',
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      stateProvince: address.stateProvince || '',
      postalCode: address.postalCode,
      countryCode: address.countryCode,
      phone: address.phone || '',
      email: address.email || '',
      deliveryInstructions: address.deliveryInstructions || '',
      isDefault: address.isDefault,
    });
    setIsEditDialogOpen(true);
  };

  // Filter addresses
  const filteredAddresses = addresses.filter(address => {
    const matchesSearch = search === '' || 
      address.name.toLowerCase().includes(search.toLowerCase()) ||
      address.addressLine1.toLowerCase().includes(search.toLowerCase()) ||
      address.city.toLowerCase().includes(search.toLowerCase()) ||
      (address.companyName && address.companyName.toLowerCase().includes(search.toLowerCase()));
    
    const matchesType = typeFilter === 'all' || address.addressType === typeFilter;
    const matchesVerification = verificationFilter === 'all' || 
      (verificationFilter === 'verified' && address.isVerified) ||
      (verificationFilter === 'unverified' && !address.isVerified);

    return matchesSearch && matchesType && matchesVerification;
  });

  // Get address type icon
  const getAddressTypeIcon = (type: string) => {
    return type === 'shipping' ? <Home className="h-4 w-4" /> : <Building className="h-4 w-4" />;
  };

  // Get address type color
  const getAddressTypeColor = (type: string) => {
    return type === 'shipping' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  };

  // Get country name
  const getCountryName = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    return country ? country.name : countryCode;
  };

  // Copy address to clipboard
  const copyAddressToClipboard = (address: Address) => {
    const addressText = [
      address.name,
      address.companyName,
      address.addressLine1,
      address.addressLine2,
      `${address.city}, ${address.stateProvince} ${address.postalCode}`,
      getCountryName(address.countryCode)
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(addressText);
    setSuccess('Address copied to clipboard');
  };

  if (loading) {
    return (
      <AddressesSkeleton />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Addresses</h1>
          <p className="text-muted-foreground">
            Manage your shipping and billing addresses
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Address
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search addresses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="shipping">Shipping</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                </SelectContent>
              </Select>
              <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                <SelectTrigger className="w-[140px]">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Addresses Grid */}
      {filteredAddresses.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No addresses found</h3>
              <p className="text-muted-foreground mb-4">
                {search || typeFilter !== 'all' || verificationFilter !== 'all'
                  ? 'No addresses match your current filters.'
                  : 'Get started by adding your first shipping address.'}
              </p>
              {(!search && typeFilter === 'all' && verificationFilter === 'all') && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Address
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAddresses.map((address) => (
            <Card key={address.id} className="relative">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className={getAddressTypeColor(address.addressType)}
                    >
                      {getAddressTypeIcon(address.addressType)}
                      <span className="ml-1 capitalize">{address.addressType}</span>
                    </Badge>
                    {address.isDefault && (
                      <Badge variant="outline">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Default
                      </Badge>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(address)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => copyAddressToClipboard(address)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </DropdownMenuItem>
                      <Separator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteAddress(address.id)}
                        className="text-destructive"
                        disabled={deleting === address.id}
                      >
                        {deleting === address.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-2">
                  {address.isVerified ? (
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Unverified
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{address.name}</span>
                  </div>
                  {address.companyName && (
                    <div className="flex items-center gap-2 mb-1">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{address.companyName}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-start gap-2">
                    <Navigation className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="text-sm">
                      <div>{address.addressLine1}</div>
                      {address.addressLine2 && <div>{address.addressLine2}</div>}
                      <div>
                        {address.city}
                        {address.stateProvince && `, ${address.stateProvince}`} {address.postalCode}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Globe className="h-3 w-3" />
                        {getCountryName(address.countryCode)}
                      </div>
                    </div>
                  </div>
                </div>

                {(address.phone || address.email) && (
                  <Separator />
                )}

                <div className="space-y-1">
                  {address.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {address.phone}
                    </div>
                  )}
                  {address.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {address.email}
                    </div>
                  )}
                </div>

                {address.deliveryInstructions && (
                  <>
                    <Separator />
                    <div className="text-sm text-muted-foreground">
                      <strong>Instructions:</strong> {address.deliveryInstructions}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Address Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Address</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Address Type */}
            <div className="grid gap-2">
              <Label htmlFor="addressType">Address Type *</Label>
              <Select value={addressForm.addressType} onValueChange={(value: 'shipping' | 'billing') => setAddressForm(prev => ({...prev, addressType: value}))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shipping">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      Shipping Address
                    </div>
                  </SelectItem>
                  <SelectItem value="billing">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Billing Address
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Name and Company */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={addressForm.name}
                  onChange={(e) => setAddressForm(prev => ({...prev, name: e.target.value}))}
                  placeholder="John Doe"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={addressForm.companyName}
                  onChange={(e) => setAddressForm(prev => ({...prev, companyName: e.target.value}))}
                  placeholder="Acme Inc. (optional)"
                />
              </div>
            </div>

            {/* Address Lines */}
            <div className="grid gap-2">
              <Label htmlFor="addressLine1">Address Line 1 *</Label>
              <Input
                id="addressLine1"
                value={addressForm.addressLine1}
                onChange={(e) => setAddressForm(prev => ({...prev, addressLine1: e.target.value}))}
                placeholder="123 Main Street"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="addressLine2">Address Line 2</Label>
              <Input
                id="addressLine2"
                value={addressForm.addressLine2}
                onChange={(e) => setAddressForm(prev => ({...prev, addressLine2: e.target.value}))}
                placeholder="Apartment, suite, unit, building, floor, etc."
              />
            </div>

            {/* City, State, Postal Code */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm(prev => ({...prev, city: e.target.value}))}
                  placeholder="New York"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stateProvince">State/Province</Label>
                <Input
                  id="stateProvince"
                  value={addressForm.stateProvince}
                  onChange={(e) => setAddressForm(prev => ({...prev, stateProvince: e.target.value}))}
                  placeholder="NY"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="postalCode">Postal Code *</Label>
                <Input
                  id="postalCode"
                  value={addressForm.postalCode}
                  onChange={(e) => setAddressForm(prev => ({...prev, postalCode: e.target.value}))}
                  placeholder="10001"
                />
              </div>
            </div>

            {/* Country */}
            <div className="grid gap-2">
              <Label htmlFor="countryCode">Country *</Label>
              <Select value={addressForm.countryCode} onValueChange={(value) => setAddressForm(prev => ({...prev, countryCode: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map(country => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm(prev => ({...prev, phone: e.target.value}))}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={addressForm.email}
                  onChange={(e) => setAddressForm(prev => ({...prev, email: e.target.value}))}
                  placeholder="john@example.com"
                />
              </div>
            </div>

            {/* Delivery Instructions */}
            <div className="grid gap-2">
              <Label htmlFor="deliveryInstructions">Delivery Instructions</Label>
              <Textarea
                id="deliveryInstructions"
                value={addressForm.deliveryInstructions}
                onChange={(e) => setAddressForm(prev => ({...prev, deliveryInstructions: e.target.value}))}
                placeholder="Leave at front door, ring doorbell, etc."
                rows={3}
              />
            </div>

            {/* Default Address */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isDefault"
                checked={addressForm.isDefault}
                onCheckedChange={(checked) => setAddressForm(prev => ({...prev, isDefault: checked as boolean}))}
              />
              <Label htmlFor="isDefault">Set as default address</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAddress} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Address'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Address Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Address</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Same form fields as create dialog */}
            {/* Address Type */}
            <div className="grid gap-2">
              <Label htmlFor="editAddressType">Address Type *</Label>
              <Select value={addressForm.addressType} onValueChange={(value: 'shipping' | 'billing') => setAddressForm(prev => ({...prev, addressType: value}))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shipping">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      Shipping Address
                    </div>
                  </SelectItem>
                  <SelectItem value="billing">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Billing Address
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Name and Company */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="editName">Full Name *</Label>
                <Input
                  id="editName"
                  value={addressForm.name}
                  onChange={(e) => setAddressForm(prev => ({...prev, name: e.target.value}))}
                  placeholder="John Doe"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editCompanyName">Company Name</Label>
                <Input
                  id="editCompanyName"
                  value={addressForm.companyName}
                  onChange={(e) => setAddressForm(prev => ({...prev, companyName: e.target.value}))}
                  placeholder="Acme Inc. (optional)"
                />
              </div>
            </div>

            {/* Address Lines */}
            <div className="grid gap-2">
              <Label htmlFor="editAddressLine1">Address Line 1 *</Label>
              <Input
                id="editAddressLine1"
                value={addressForm.addressLine1}
                onChange={(e) => setAddressForm(prev => ({...prev, addressLine1: e.target.value}))}
                placeholder="123 Main Street"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editAddressLine2">Address Line 2</Label>
              <Input
                id="editAddressLine2"
                value={addressForm.addressLine2}
                onChange={(e) => setAddressForm(prev => ({...prev, addressLine2: e.target.value}))}
                placeholder="Apartment, suite, unit, building, floor, etc."
              />
            </div>

            {/* City, State, Postal Code */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="editCity">City *</Label>
                <Input
                  id="editCity"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm(prev => ({...prev, city: e.target.value}))}
                  placeholder="New York"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editStateProvince">State/Province</Label>
                <Input
                  id="editStateProvince"
                  value={addressForm.stateProvince}
                  onChange={(e) => setAddressForm(prev => ({...prev, stateProvince: e.target.value}))}
                  placeholder="NY"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editPostalCode">Postal Code *</Label>
                <Input
                  id="editPostalCode"
                  value={addressForm.postalCode}
                  onChange={(e) => setAddressForm(prev => ({...prev, postalCode: e.target.value}))}
                  placeholder="10001"
                />
              </div>
            </div>

            {/* Country */}
            <div className="grid gap-2">
              <Label htmlFor="editCountryCode">Country *</Label>
              <Select value={addressForm.countryCode} onValueChange={(value) => setAddressForm(prev => ({...prev, countryCode: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map(country => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="editPhone">Phone Number</Label>
                <Input
                  id="editPhone"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm(prev => ({...prev, phone: e.target.value}))}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editEmail">Email Address</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={addressForm.email}
                  onChange={(e) => setAddressForm(prev => ({...prev, email: e.target.value}))}
                  placeholder="john@example.com"
                />
              </div>
            </div>

            {/* Delivery Instructions */}
            <div className="grid gap-2">
              <Label htmlFor="editDeliveryInstructions">Delivery Instructions</Label>
              <Textarea
                id="editDeliveryInstructions"
                value={addressForm.deliveryInstructions}
                onChange={(e) => setAddressForm(prev => ({...prev, deliveryInstructions: e.target.value}))}
                placeholder="Leave at front door, ring doorbell, etc."
                rows={3}
              />
            </div>

            {/* Default Address */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="editIsDefault"
                checked={addressForm.isDefault}
                onCheckedChange={(checked) => setAddressForm(prev => ({...prev, isDefault: checked as boolean}))}
              />
              <Label htmlFor="editIsDefault">Set as default address</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditAddress} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Address'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}