// app/(customer)/personal-shopping/requests/[id]/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, CheckCircle, XCircle, CreditCard, Edit, Package, Clock, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface PersonalShoppingRequestDetail {
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
  createdAt: string;
  updatedAt: string;
  items: any[];
  statusHistory: any[];
}

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800', description: 'Request is saved as draft' },
  submitted: { label: 'Under Review', color: 'bg-blue-100 text-blue-800', description: 'Our team is reviewing your request' },
  quoted: { label: 'Quote Ready', color: 'bg-yellow-100 text-yellow-800', description: 'Quote is ready for your approval' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800', description: 'Quote approved, waiting for purchase' },
  purchasing: { label: 'Purchasing', color: 'bg-purple-100 text-purple-800', description: 'We are purchasing your items' },
  purchased: { label: 'Purchased', color: 'bg-indigo-100 text-indigo-800', description: 'Items purchased, waiting for delivery to warehouse' },
  received: { label: 'Received', color: 'bg-green-100 text-green-800', description: 'Items received at warehouse' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', description: 'Request has been cancelled' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800', description: 'Request completed successfully' },
};

export default function PersonalShoppingRequestDetail() {
  const [request, setRequest] = useState<PersonalShoppingRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const params = useParams();
  const router = useRouter();
  // Using Sonner toast directly

  const requestId = params.id as string;

  useEffect(() => {
    if (requestId) {
      fetchRequestDetail();
    }
  }, [requestId]);

  const fetchRequestDetail = async () => {
    try {
      const response = await fetch(`/api/personal-shopping/requests/${requestId}`);
      if (response.ok) {
        const data = await response.json();
        setRequest(data);
      } else {
        throw new Error('Failed to fetch request details');
      }
    } catch (error) {
      console.error('Error fetching request:', error);
      toast.error("Failed to load request details");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveQuote = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/personal-shopping/requests/${requestId}/approve`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success("Your quote has been approved. We'll start purchasing your items.");
        fetchRequestDetail();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve quote');
      }
    } catch (error) {
      console.error('Error approving quote:', error);
      toast.error(error instanceof Error ? error.message : "Failed to approve quote");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayment = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/personal-shopping/requests/${requestId}/payment`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create payment session');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error(error instanceof Error ? error.message : "Failed to create payment session");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!confirm('Are you sure you want to cancel this request? This action cannot be undone.')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/personal-shopping/requests/${requestId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success("Your request has been cancelled successfully");
        router.push('/dashboard/personal-shopping');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel request');
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error(error instanceof Error ? error.message : "Failed to cancel request");
    } finally {
      setActionLoading(false);
    }
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
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Request Not Found</h1>
        <p className="text-gray-600 mb-6">The personal shopping request you're looking for doesn't exist.</p>
        <Button asChild>
          <Link href="/dashboard/personal-shopping">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Personal Shopping
          </Link>
        </Button>
      </div>
    );
  }

  const config = statusConfig[request.status as keyof typeof statusConfig];

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/dashboard/personal-shopping">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Personal Shopping
        </Link>
      </Button>

      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{request.requestNumber}</CardTitle>
                <CardDescription>
                  Created {new Date(request.createdAt).toLocaleDateString()}
                </CardDescription>
              </div>
              <Badge className={config?.color}>
                {config?.label}
              </Badge>
            </div>
            <p className="text-gray-600">{config?.description}</p>
          </CardHeader>
        </Card>

        {/* Actions */}
        {request.status === 'quoted' && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Quote Ready for Approval
              </CardTitle>
              <CardDescription>
                Review the quote below and approve to proceed with purchasing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button onClick={handleApproveQuote} disabled={actionLoading}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Quote
                </Button>
                <Button variant="outline" onClick={handleCancelRequest} disabled={actionLoading}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Request
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {request.status === 'approved' && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Required
              </CardTitle>
              <CardDescription>
                Your quote has been approved. Please complete payment to start purchasing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handlePayment} disabled={actionLoading}>
                <CreditCard className="h-4 w-4 mr-2" />
                Pay Now - ${parseFloat(request.totalAmount).toFixed(2)} {request.currencyCode}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Items ({request.items.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {request.items.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      {item.url && (
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 mt-1"
                        >
                          View Product <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm text-gray-600">
                        {item.size && (
                          <div><span className="font-medium">Size:</span> {item.size}</div>
                        )}
                        {item.color && (
                          <div><span className="font-medium">Color:</span> {item.color}</div>
                        )}
                        <div><span className="font-medium">Qty:</span> {item.quantity}</div>
                        {item.maxBudgetPerItem && (
                          <div><span className="font-medium">Max Budget:</span> ${parseFloat(item.maxBudgetPerItem).toFixed(2)}</div>
                        )}
                      </div>
                      
                      {item.additionalInstructions && (
                        <div className="mt-2 text-sm">
                          <span className="font-medium">Instructions:</span> {item.additionalInstructions}
                        </div>
                      )}
                    </div>
                    
                    {item.status && (
                      <Badge variant="outline" className="ml-4">
                        {item.status}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        {(request.estimatedCost || request.actualCost || request.serviceFee) && (
          <Card>
            <CardHeader>
              <CardTitle>Pricing Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {request.estimatedCost && parseFloat(request.estimatedCost) > 0 && (
                  <div className="flex justify-between">
                    <span>Estimated Item Cost:</span>
                    <span>${parseFloat(request.estimatedCost).toFixed(2)} {request.currencyCode}</span>
                  </div>
                )}
                {request.actualCost && parseFloat(request.actualCost) > 0 && (
                  <div className="flex justify-between">
                    <span>Actual Item Cost:</span>
                    <span>${parseFloat(request.actualCost).toFixed(2)} {request.currencyCode}</span>
                  </div>
                )}
                {request.serviceFee && parseFloat(request.serviceFee) > 0 && (
                  <div className="flex justify-between">
                    <span>Service Fee:</span>
                    <span>${parseFloat(request.serviceFee).toFixed(2)} {request.currencyCode}</span>
                  </div>
                )}
                {request.totalAmount && parseFloat(request.totalAmount) > 0 && (
                  <>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total Amount:</span>
                      <span>${parseFloat(request.totalAmount).toFixed(2)} {request.currencyCode}</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Shipping Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Shipping Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {request.shippingOption && (
                <div className="flex justify-between">
                  <span>Preferred Service:</span>
                  <span>{request.shippingOption}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping Preference:</span>
                <span>
                  {request.shippingPreference === 'send_together' && 'Send everything together'}
                  {request.shippingPreference === 'send_as_available' && 'Send items as available'}
                  {request.shippingPreference === 'send_by_category' && 'Send similar items together'}
                  {request.shippingPreference === 'fastest_delivery' && 'Prioritize fastest delivery'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Allow Alternate Retailers:</span>
                <span>{request.allowAlternateRetailers ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Special Instructions */}
        {request.specialInstructions && (
          <Card>
            <CardHeader>
              <CardTitle>Special Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{request.specialInstructions}</p>
            </CardContent>
          </Card>
        )}

        {/* Status History */}
        {request.statusHistory && request.statusHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Status History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {request.statusHistory.map((entry, index) => (
                  <div key={entry.id} className="flex items-start gap-3 pb-4 border-b last:border-b-0">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {statusConfig[entry.status as keyof typeof statusConfig]?.label || entry.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(entry.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {entry.notes && (
                        <p className="text-sm text-gray-700 mt-1">{entry.notes}</p>
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
        )}

        {/* Actions */}
        {['draft', 'submitted'].includes(request.status) && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-3">
                {request.status === 'draft' && (
                  <Button variant="outline" asChild>
                    <Link href={`/personal-shopping/requests/${requestId}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Request
                    </Link>
                  </Button>
                )}
                <Button 
                  variant="destructive" 
                  onClick={handleCancelRequest} 
                  disabled={actionLoading}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Request
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}