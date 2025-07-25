// app/(dashboard)/dashboard/shipments/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  Truck, 
  Plus, 
  Eye, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink, 
  Search, 
  Filter, 
  Download, 
  Loader2, 
  Building, 
  Home, 
  DollarSign, 
  Weight, 
  Ruler, 
  Star, 
  Box,
  Calendar,
  CreditCard,
  FileText,
  AlertCircle,
  Navigation,
  Globe,
  Phone,
  Mail,
  User,
  Copy,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface Package {
  id: string;
  internalId: string;
  trackingNumberInbound: string;
  description: string;
  weightActualKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  estimatedValue: number;
  estimatedValueCurrency: string;
  status: string;
  senderName?: string;
  isFragile: boolean;
  isHighValue: boolean;
  requiresAdultSignature: boolean;
}

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
}

interface Shipment {
  id: string;
  shipmentNumber: string;
  status: string;
  trackingNumber?: string;
  carrierCode?: string;
  serviceType?: string;
  totalWeightKg: number;
  totalDeclaredValue: number;
  declaredValueCurrency: string;
  totalCost?: number;
  costCurrency?: string;
  quoteExpiresAt?: string;
  paidAt?: string;
  dispatchedAt?: string;
  estimatedDeliveryDate?: string;
  deliveredAt?: string;
  deliveryInstructions?: string;
  requiresSignature: boolean;
  customsStatus?: string;
  commercialInvoiceUrl?: string;
  createdAt: string;
  updatedAt: string;
  warehouseName: string;
  warehouseCode: string;
  shippingAddress?: Address;
  billingAddress?: Address;
  packages: Package[];
}

interface Country {
  id: string;
  code: string;
  name: string;
}

export default function ShipmentsPage() {
  const [activeTab, setActiveTab] = useState('packages');
  const [packages, setPackages] = useState<Package[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackages, setSelectedPackages] = useState<Set<string>>(new Set());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);

  // Create shipment form
  const [shipmentForm, setShipmentForm] = useState({
    shippingAddressId: '',
    billingAddressId: '',
    serviceType: 'standard',
    declaredValue: '',
    declaredValueCurrency: 'USD',
    deliveryInstructions: '',
    requiresSignature: false,
  });

  // Error and success states
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch data functions
  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/customer/packages?status=ready_to_ship');
      if (response.ok) {
        const data = await response.json();
        setPackages(data.packages || []);
      } else {
        setError('Failed to fetch packages');
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      setError('Failed to fetch packages');
    }
  };

  const fetchShipments = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
      });
      
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (search) params.append('search', search);

      const response = await fetch(`/api/customer/shipments?${params}`);
      if (response.ok) {
        const data = await response.json();
        setShipments(data.shipments || []);
        setTotalPages(data.pagination?.pages || 1);
        setCurrentPage(data.pagination?.page || 1);
      } else {
        setError('Failed to fetch shipments');
      }
    } catch (error) {
      console.error('Error fetching shipments:', error);
      setError('Failed to fetch shipments');
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await fetch('/api/customer/addresses');
      if (response.ok) {
        const data = await response.json();
        setAddresses(data);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const fetchCountries = async () => {
    try {
      const response = await fetch('/api/customer/countries');
      if (response.ok) {
        const data = await response.json();
        // Fix: Extract the countries array from the response object
        setCountries(data.countries || data); // Handle both response formats
      } else {
        // Set fallback countries if API fails
        setCountries([]);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
      // Set fallback countries in case of error
      setCountries([]);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchPackages(),
        fetchShipments(),
        fetchAddresses(),
        fetchCountries(),
      ]);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Re-fetch shipments when filters change
  useEffect(() => {
    fetchShipments(1);
  }, [statusFilter, search]);

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

  // Handle package selection
  const handlePackageSelect = (packageId: string) => {
    const newSelected = new Set(selectedPackages);
    if (newSelected.has(packageId)) {
      newSelected.delete(packageId);
    } else {
      newSelected.add(packageId);
    }
    setSelectedPackages(newSelected);
  };

  const handleSelectAllPackages = () => {
    if (selectedPackages.size === packages.length) {
      setSelectedPackages(new Set());
    } else {
      setSelectedPackages(new Set(packages.map(pkg => pkg.id)));
    }
  };

  // Create shipment
  const handleCreateShipment = async () => {
    if (selectedPackages.size === 0) {
      setError('Please select at least one package');
      return;
    }
  
    if (!shipmentForm.shippingAddressId) {
      setError('Please select a shipping address');
      return;
    }
  
    try {
      setCreating(true);
      setError(null);
  
      // Prepare shipment data with proper handling of billingAddressId
      const shipmentData = {
        packageIds: Array.from(selectedPackages),
        ...shipmentForm,
        // Convert "none" to null for billingAddressId
        billingAddressId: shipmentForm.billingAddressId === 'none' ? 
          null : shipmentForm.billingAddressId,
        declaredValue: shipmentForm.declaredValue ? 
          parseFloat(shipmentForm.declaredValue) : undefined,
      };
  
      const response = await fetch('/api/customer/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shipmentData),
      });
  
      if (response.ok) {
        const data = await response.json();
        
        // Show success message
        setSuccess(`Shipment ${data.shipment.shipmentNumber} created successfully!`);
        
        // Close dialog and reset form
        setIsCreateDialogOpen(false);
        setSelectedPackages(new Set());
        setShipmentForm({
          shippingAddressId: '',
          billingAddressId: '',
          serviceType: 'standard',
          declaredValue: '',
          declaredValueCurrency: 'USD',
          deliveryInstructions: '',
          requiresSignature: false,
        });
  
        // Refresh data
        await fetchPackages();
        await fetchShipments();
  
        // Check if we need to redirect based on response
        if (data.redirect) {
          // Add a small delay to show success message
          setTimeout(() => {
            // Redirect to the shipment detail page
            window.location.href = data.redirect.url;
          }, 1500);
        }
        
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create shipment');
      }
    } catch (error) {
      console.error('Error creating shipment:', error);
      setError('Failed to create shipment');
    } finally {
      setCreating(false);
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'quote_requested':
        return 'bg-yellow-100 text-yellow-800';
      case 'quoted':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-orange-100 text-orange-800';
      case 'dispatched':
      case 'in_transit':
        return 'bg-purple-100 text-purple-800';
      case 'out_for_delivery':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'delivery_failed':
      case 'returned':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'quote_requested':
      case 'quoted':
        return Clock;
      case 'paid':
      case 'processing':
        return Package;
      case 'dispatched':
      case 'in_transit':
      case 'out_for_delivery':
        return Truck;
      case 'delivered':
        return CheckCircle;
      case 'delivery_failed':
      case 'returned':
      case 'cancelled':
        return AlertTriangle;
      default:
        return AlertCircle;
    }
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    if (!amount) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Get country name
  const getCountryName = (countryCode: string) => {
    // Add defensive check to ensure countries is an array
    if (!Array.isArray(countries)) {
      console.warn('Countries is not an array:', countries);
      return countryCode; // Return country code as fallback
    }
    
    const country = countries.find(c => c.code === countryCode);
    return country ? country.name : countryCode;
  };

  // Copy tracking number
  const copyTrackingNumber = (trackingNumber: string) => {
    navigator.clipboard.writeText(trackingNumber);
    setSuccess('Tracking number copied to clipboard');
  };

  if (loading && shipments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shipments</h1>
          <p className="text-muted-foreground">
            Create and track your shipments
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          disabled={packages.length === 0}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Shipment
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="packages" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Ready Packages ({packages.length})
          </TabsTrigger>
          <TabsTrigger value="shipments" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            My Shipments ({shipments.length})
          </TabsTrigger>
        </TabsList>

        {/* Ready Packages Tab */}
        <TabsContent value="packages" className="space-y-4">
          {packages.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No packages ready</h3>
                  <p className="text-muted-foreground mb-4">
                    You don't have any packages ready for shipping yet.
                  </p>
                  <Button variant="outline" asChild>
                    <Link href="/dashboard/packages">
                      View All Packages
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Packages Ready to Ship</CardTitle>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedPackages.size === packages.length && packages.length > 0}
                      onCheckedChange={handleSelectAllPackages}
                    />
                    <span className="text-sm text-muted-foreground">
                      Select All ({selectedPackages.size} selected)
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className={`border rounded-lg p-4 ${
                        selectedPackages.has(pkg.id) ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedPackages.has(pkg.id)}
                            onCheckedChange={() => handlePackageSelect(pkg.id)}
                          />
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{pkg.internalId}</span>
                              <Badge variant="outline">{pkg.status}</Badge>
                              {pkg.isFragile && (
                                <Badge variant="destructive" className="text-xs">
                                  Fragile
                                </Badge>
                              )}
                              {pkg.isHighValue && (
                                <Badge variant="secondary" className="text-xs">
                                  High Value
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <div>{pkg.description}</div>
                              {pkg.senderName && <div>From: {pkg.senderName}</div>}
                              {pkg.trackingNumberInbound && (
                                <div>Inbound: {pkg.trackingNumberInbound}</div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Weight className="h-3 w-3" />
                            {pkg.weightActualKg}kg
                          </div>
                          {(pkg.lengthCm || pkg.widthCm || pkg.heightCm) && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Ruler className="h-3 w-3" />
                              {pkg.lengthCm}×{pkg.widthCm}×{pkg.heightCm}cm
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="h-3 w-3" />
                            {formatCurrency(pkg.estimatedValue, pkg.estimatedValueCurrency)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Shipments Tab */}
        <TabsContent value="shipments" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by shipment number, tracking number, or carrier..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="quote_requested">Quote Requested</SelectItem>
                      <SelectItem value="quoted">Quoted</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="dispatched">Dispatched</SelectItem>
                      <SelectItem value="in_transit">In Transit</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => fetchShipments(currentPage)}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipments List */}
          {shipments.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No shipments found</h3>
                  <p className="text-muted-foreground mb-4">
                    {search || statusFilter !== 'all'
                      ? 'No shipments match your current filters.'
                      : 'You haven\'t created any shipments yet.'}
                  </p>
                  {(!search && statusFilter === 'all') && (
                    <Button onClick={() => setIsCreateDialogOpen(true)} disabled={packages.length === 0}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Shipment
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {shipments.map((shipment) => {
                const StatusIcon = getStatusIcon(shipment.status);
                return (
                  <Card key={shipment.id}>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <StatusIcon className="h-5 w-5" />
                            <span className="font-semibold">{shipment.shipmentNumber}</span>
                          </div>
                          <Badge className={getStatusColor(shipment.status)}>
                            {shipment.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                          {shipment.customsStatus && shipment.customsStatus !== 'cleared' && (
                            <Badge variant="outline" className="text-orange-600 border-orange-200">
                              Customs: {shipment.customsStatus}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {shipment.trackingNumber && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyTrackingNumber(shipment.trackingNumber!)}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              {shipment.trackingNumber}
                            </Button>
                          )}
                          {shipment.commercialInvoiceUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={shipment.commercialInvoiceUrl} target="_blank" rel="noopener noreferrer">
                                <FileText className="h-3 w-3 mr-1" />
                                Invoice
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Shipment Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Shipment Details</h4>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            {shipment.carrierCode && (
                              <div className="flex items-center gap-2">
                                <Truck className="h-3 w-3" />
                                {shipment.carrierCode} - {shipment.serviceType}
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Weight className="h-3 w-3" />
                              {shipment.totalWeightKg}kg
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-3 w-3" />
                              Value: {formatCurrency(shipment.totalDeclaredValue, shipment.declaredValueCurrency)}
                            </div>
                            {shipment.totalCost && (
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-3 w-3" />
                                Cost: {formatCurrency(shipment.totalCost, shipment.costCurrency)}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Important Dates</h4>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              Created: {format(new Date(shipment.createdAt), 'MMM dd, yyyy')}
                            </div>
                            {shipment.paidAt && (
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-3 w-3" />
                                Paid: {format(new Date(shipment.paidAt), 'MMM dd, yyyy')}
                              </div>
                            )}
                            {shipment.dispatchedAt && (
                              <div className="flex items-center gap-2">
                                <Truck className="h-3 w-3" />
                                Dispatched: {format(new Date(shipment.dispatchedAt), 'MMM dd, yyyy')}
                              </div>
                            )}
                            {shipment.estimatedDeliveryDate && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                ETA: {format(new Date(shipment.estimatedDeliveryDate), 'MMM dd, yyyy')}
                              </div>
                            )}
                            {shipment.deliveredAt && (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-3 w-3" />
                                Delivered: {format(new Date(shipment.deliveredAt), 'MMM dd, yyyy')}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Delivery Information</h4>
                          {shipment.shippingAddress ? (
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-start gap-2">
                                <Navigation className="h-3 w-3 mt-0.5" />
                                <div>
                                  <div className="font-medium text-foreground">{shipment.shippingAddress.name}</div>
                                  <div>{shipment.shippingAddress.addressLine1}</div>
                                  {shipment.shippingAddress.addressLine2 && (
                                    <div>{shipment.shippingAddress.addressLine2}</div>
                                  )}
                                  <div>
                                    {shipment.shippingAddress.city}
                                    {shipment.shippingAddress.stateProvince && `, ${shipment.shippingAddress.stateProvince}`} {shipment.shippingAddress.postalCode}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Globe className="h-3 w-3" />
                                    {getCountryName(shipment.shippingAddress.countryCode)}
                                  </div>
                                </div>
                              </div>
                              {shipment.shippingAddress.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3 w-3" />
                                  {shipment.shippingAddress.phone}
                                </div>
                              )}
                              {shipment.requiresSignature && (
                                <div className="flex items-center gap-2 text-orange-600">
                                  <User className="h-3 w-3" />
                                  Signature Required
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">No shipping address</div>
                          )}
                        </div>
                      </div>

                      {/* Packages in Shipment */}
                      {shipment.packages && shipment.packages.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="font-medium text-sm mb-2">
                              Packages ({shipment.packages.length})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {shipment.packages.map((pkg) => (
                                <div key={pkg.id} className="border rounded-lg p-3 text-sm">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Box className="h-3 w-3" />
                                    <span className="font-medium">{pkg.internalId}</span>
                                    {pkg.isFragile && (
                                      <Badge variant="destructive" className="text-xs h-4">
                                        Fragile
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-muted-foreground">
                                    <div>{pkg.description}</div>
                                    <div className="flex items-center gap-4 mt-1">
                                      <span>{pkg.weightActualKg}kg</span>
                                      <span>{formatCurrency(pkg.estimatedValue, pkg.estimatedValueCurrency)}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Delivery Instructions */}
                      {shipment.deliveryInstructions && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="font-medium text-sm mb-1">Delivery Instructions</h4>
                            <p className="text-sm text-muted-foreground">{shipment.deliveryInstructions}</p>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchShipments(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchShipments(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Shipment Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Shipment</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Selected Packages Summary */}
            {selectedPackages.size > 0 && (
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Selected Packages ({selectedPackages.size})</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {packages
                    .filter(pkg => selectedPackages.has(pkg.id))
                    .map(pkg => (
                      <div key={pkg.id} className="flex items-center justify-between text-sm">
                        <span>{pkg.internalId} - {pkg.description}</span>
                        <span>{pkg.weightActualKg}kg</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Shipping Address */}
            <div className="space-y-2">
              <Label htmlFor="shippingAddress">Shipping Address *</Label>
              <Select value={shipmentForm.shippingAddressId} onValueChange={(value) => setShipmentForm(prev => ({...prev, shippingAddressId: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select shipping address" />
                </SelectTrigger>
                <SelectContent>
                  {addresses
                    .filter(addr => addr.addressType === 'shipping')
                    .map(address => (
                      <SelectItem key={address.id} value={address.id}>
                        <div className="flex items-center gap-2">
                          {address.isDefault && <Star className="h-3 w-3 fill-current" />}
                          <span>
                            {address.name} - {address.city}, {getCountryName(address.countryCode)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {addresses.filter(addr => addr.addressType === 'shipping').length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No shipping addresses found. <Link href="/dashboard/addresses" className="text-primary hover:underline">Add one</Link>
                </p>
              )}
            </div>

            {/* Billing Address */}
            <div className="space-y-2">
              <Label htmlFor="billingAddress">Billing Address</Label>
              <Select value={shipmentForm.billingAddressId} onValueChange={(value) => setShipmentForm(prev => ({...prev, billingAddressId: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select billing address (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Same as shipping address</SelectItem>
                  {addresses
                    .filter(addr => addr.addressType === 'billing')
                    .map(address => (
                      <SelectItem key={address.id} value={address.id}>
                        <div className="flex items-center gap-2">
                          {address.isDefault && <Star className="h-3 w-3 fill-current" />}
                          <span>
                            {address.name} - {address.city}, {getCountryName(address.countryCode)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Service Type */}
            <div className="space-y-2">
              <Label htmlFor="serviceType">Service Type</Label>
              <Select value={shipmentForm.serviceType} onValueChange={(value) => setShipmentForm(prev => ({...prev, serviceType: value}))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="express">Express</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="economy">Economy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Declared Value */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="declaredValue">Declared Value</Label>
                <Input
                  id="declaredValue"
                  type="number"
                  step="0.01"
                  value={shipmentForm.declaredValue}
                  onChange={(e) => setShipmentForm(prev => ({...prev, declaredValue: e.target.value}))}
                  placeholder="Leave empty to use package values"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="declaredValueCurrency">Currency</Label>
                <Select value={shipmentForm.declaredValueCurrency} onValueChange={(value) => setShipmentForm(prev => ({...prev, declaredValueCurrency: value}))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="AED">AED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Delivery Instructions */}
            <div className="space-y-2">
              <Label htmlFor="deliveryInstructions">Delivery Instructions</Label>
              <Textarea
                id="deliveryInstructions"
                value={shipmentForm.deliveryInstructions}
                onChange={(e) => setShipmentForm(prev => ({...prev, deliveryInstructions: e.target.value}))}
                placeholder="Special delivery instructions (optional)"
                rows={3}
              />
            </div>

            {/* Signature Required */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requiresSignature"
                checked={shipmentForm.requiresSignature}
                onCheckedChange={(checked) => setShipmentForm(prev => ({...prev, requiresSignature: checked as boolean}))}
              />
              <Label htmlFor="requiresSignature">Require signature on delivery</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateShipment} 
              disabled={creating || selectedPackages.size === 0 || !shipmentForm.shippingAddressId}
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Shipment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}