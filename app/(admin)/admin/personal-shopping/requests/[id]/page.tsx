// app/(admin)/admin/personal-shopping/requests/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Package,
  DollarSign,
  Clock,
  CheckCircle,
  ShoppingCart,
  FileText,
  AlertCircle,
  Save,
  Calculator
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface PersonalShoppingRequest {
  id: string;
  requestNumber: string;
  status: string;
  shippingOption: string;
  shippingPreference: string;
  allowAlternateRetailers: boolean;
  estimatedCost: string;
  actualCost: string;
  serviceFee: string;
  totalAmount: string;
  currencyCode: string;
  quotedAt: string | null;
  approvedAt: string | null;
  purchasedAt: string | null;
  specialInstructions: string;
  internalNotes: string;
  createdAt: string;
  updatedAt: string;
  customerName: string;
  customerEmail: string;
  customerId: string;
  customerPhone: string;
  items: PersonalShoppingRequestItem[];
  statusHistory: StatusHistoryEntry[];
}

interface PersonalShoppingRequestItem {
  id: string;
  name: string;
  url: string;
  description: string;
  size: string;
  color: string;
  variant: string;
  quantity: string;
  maxBudgetPerItem: string;
  actualPrice: string;
  totalItemCost: string;
  additionalInstructions: string;
  retailerName: string;
  retailerOrderNumber: string;
  purchasedAt: string | null;
  status: string;
}

interface StatusHistoryEntry {
  id: string;
  status: string;
  notes: string;
  changeReason: string;
  createdAt: string;
  changedByName: string;
  changedByEmail: string;
}

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  submitted: { label: 'Pending Review', color: 'bg-blue-100 text-blue-800' },
  quoted: { label: 'Quoted', color: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800' },
  purchasing: { label: 'Purchasing', color: 'bg-purple-100 text-purple-800' },
  purchased: { label: 'Purchased', color: 'bg-indigo-100 text-indigo-800' },
  received: { label: 'Received', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
};

export default function AdminPersonalShoppingRequestDetail() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;
  
  const [request, setRequest] = useState<PersonalShoppingRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Quote form state
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteData, setQuoteData] = useState({
    estimatedCost: '',
    serviceFee: '',
    internalNotes: ''
  });

  useEffect(() => {
    if (requestId) {
      fetchRequest();
    }
  }, [requestId]);

  const fetchRequest = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/personal-shopping/requests/${requestId}`);
      if (response.ok) {
        const data = await response.json();
        setRequest(data);
        // Initialize quote form with existing data
        setQuoteData({
          estimatedCost: data.estimatedCost || '',
          serviceFee: data.serviceFee || '',
          internalNotes: data.internalNotes || ''
        });
      } else {
        throw new Error('Failed to fetch request');
      }
    } catch (error) {
      console.error('Error fetching request:', error);
      toast.error('Failed to load request details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (action: string, additionalData?: any) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/personal-shopping/requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          ...additionalData,
        }),
      });

      if (response.ok) {
        toast.success('Request updated successfully');
        fetchRequest(); // Refresh data
        setShowQuoteForm(false);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update request');
      }
    } catch (error) {
      console.error('Error updating request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update request');
    } finally {
      setUpdating(false);
    }
  };

  const handleProvideQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!quoteData.estimatedCost || !quoteData.serviceFee) {
      toast.error('Please provide both estimated cost and service fee');
      return;
    }

    await handleStatusUpdate('provide_quote', {
      estimated_cost: quoteData.estimatedCost,
      service_fee: quoteData.serviceFee,
      internal_notes: quoteData.internalNotes,
    });
  };

  const calculateTotal = () => {
    const estimated = parseFloat(quoteData.estimatedCost) || 0;
    const service = parseFloat(quoteData.serviceFee) || 0;
    return estimated + service;
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return <Badge variant="outline">{status}</Badge>;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Request not found or you don't have permission to view it.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/admin/personal-shopping">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Requests
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{request.requestNumber}</h1>
            <p className="text-gray-600">Personal Shopping Request Details</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <StatusBadge status={request.status} />
          {request.status === 'submitted' && (
            <Button onClick={() => setShowQuoteForm(true)}>
              <Calculator className="h-4 w-4 mr-2" />
              Provide Quote
            </Button>
          )}
          {request.status === 'approved' && (
            <Button onClick={() => handleStatusUpdate('mark_purchasing')}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Start Purchasing
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Name</Label>
                  <p className="text-sm font-semibold">{request.customerName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Customer ID</Label>
                  <p className="text-sm font-mono">{request.customerId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Email</Label>
                  <p className="text-sm">{request.customerEmail}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Phone</Label>
                  <p className="text-sm">{request.customerPhone || 'Not provided'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Request Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Requested Items ({request.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {request.items.map((item, index) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{item.name}</h4>
                      <Badge variant="outline">Qty: {item.quantity}</Badge>
                    </div>
                    
                    {item.url && (
                      <div className="mb-2">
                        <Label className="text-xs text-gray-600">URL</Label>
                        <p className="text-sm">
                          <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline break-all"
                          >
                            {item.url}
                          </a>
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      {item.size && (
                        <div>
                          <Label className="text-xs text-gray-600">Size</Label>
                          <p>{item.size}</p>
                        </div>
                      )}
                      {item.color && (
                        <div>
                          <Label className="text-xs text-gray-600">Color</Label>
                          <p>{item.color}</p>
                        </div>
                      )}
                      {item.variant && (
                        <div>
                          <Label className="text-xs text-gray-600">Variant</Label>
                          <p>{item.variant}</p>
                        </div>
                      )}
                      {item.maxBudgetPerItem && (
                        <div>
                          <Label className="text-xs text-gray-600">Max Budget</Label>
                          <p>${parseFloat(item.maxBudgetPerItem).toFixed(2)}</p>
                        </div>
                      )}
                    </div>

                    {item.description && (
                      <div className="mt-2">
                        <Label className="text-xs text-gray-600">Description</Label>
                        <p className="text-sm text-gray-700">{item.description}</p>
                      </div>
                    )}

                    {item.additionalInstructions && (
                      <div className="mt-2">
                        <Label className="text-xs text-gray-600">Special Instructions</Label>
                        <p className="text-sm text-gray-700">{item.additionalInstructions}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quote Form */}
          {showQuoteForm && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Provide Quote
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProvideQuote} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="estimatedCost">Estimated Cost *</Label>
                      <Input
                        id="estimatedCost"
                        type="number"
                        step="0.01"
                        min="0"
                        value={quoteData.estimatedCost}
                        onChange={(e) => setQuoteData(prev => ({ ...prev, estimatedCost: e.target.value }))}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="serviceFee">Service Fee *</Label>
                      <Input
                        id="serviceFee"
                        type="number"
                        step="0.01"
                        min="0"
                        value={quoteData.serviceFee}
                        onChange={(e) => setQuoteData(prev => ({ ...prev, serviceFee: e.target.value }))}
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Total Amount</Label>
                    <p className="text-2xl font-bold text-green-600">
                      ${calculateTotal().toFixed(2)} {request.currencyCode}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="internalNotes">Internal Notes</Label>
                    <Textarea
                      id="internalNotes"
                      value={quoteData.internalNotes}
                      onChange={(e) => setQuoteData(prev => ({ ...prev, internalNotes: e.target.value }))}
                      placeholder="Add any internal notes about the quote..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowQuoteForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={updating}>
                      {updating ? 'Saving...' : 'Provide Quote'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Special Instructions */}
          {request.specialInstructions && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Special Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {request.specialInstructions}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Internal Notes */}
          {request.internalNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Internal Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {request.internalNotes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Estimated Cost:</span>
                <span className="font-medium">
                  {request.estimatedCost ? `$${parseFloat(request.estimatedCost).toFixed(2)}` : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Service Fee:</span>
                <span className="font-medium">
                  {request.serviceFee ? `$${parseFloat(request.serviceFee).toFixed(2)}` : '-'}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-medium">Total Amount:</span>
                <span className="font-bold text-lg text-green-600">
                  {request.totalAmount ? `$${parseFloat(request.totalAmount).toFixed(2)}` : '-'} {request.currencyCode}
                </span>
              </div>
              {request.actualCost && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Actual Cost:</span>
                    <span className="font-medium">
                      ${parseFloat(request.actualCost).toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Request Details */}
          <Card>
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm text-gray-600">Shipping Preference</Label>
                <p className="text-sm font-medium capitalize">
                  {request.shippingPreference?.replace('_', ' ') || 'Not specified'}
                </p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Allow Alternate Retailers</Label>
                <p className="text-sm font-medium">
                  {request.allowAlternateRetailers ? 'Yes' : 'No'}
                </p>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Created</Label>
                <p className="text-sm">{format(new Date(request.createdAt), 'PPp')}</p>
              </div>
              {request.quotedAt && (
                <div>
                  <Label className="text-sm text-gray-600">Quoted</Label>
                  <p className="text-sm">{format(new Date(request.quotedAt), 'PPp')}</p>
                </div>
              )}
              {request.approvedAt && (
                <div>
                  <Label className="text-sm text-gray-600">Approved</Label>
                  <p className="text-sm">{format(new Date(request.approvedAt), 'PPp')}</p>
                </div>
              )}
              {request.purchasedAt && (
                <div>
                  <Label className="text-sm text-gray-600">Purchased</Label>
                  <p className="text-sm">{format(new Date(request.purchasedAt), 'PPp')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Status History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {request.statusHistory.map((entry) => (
                  <div key={entry.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <StatusBadge status={entry.status} />
                        <span className="text-xs text-gray-500">
                          {format(new Date(entry.createdAt), 'MMM d, HH:mm')}
                        </span>
                      </div>
                      {entry.notes && (
                        <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>
                      )}
                      {entry.changedByName && (
                        <p className="text-xs text-gray-500 mt-1">
                          by {entry.changedByName}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}