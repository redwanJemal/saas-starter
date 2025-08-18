// app/(dashboard)/dashboard/invoices/[id]/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Download, CreditCard, CheckCircle, AlertCircle, Clock, FileText, Truck, Package, Receipt, Building, ShoppingCart, ExternalLink, Copy, Mail, Phone, MapPin, User, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  taxRate: number;
  taxAmount: number;
  referenceType?: string;
  referenceId?: string;
  sortOrder: number;
}

interface InvoiceDetail {
  id: string;
  invoiceNumber: string;
  invoiceType: string;
  paymentStatus: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currencyCode: string;
  paidAmount: number;
  balanceDue: number;
  paymentMethod?: string;
  paymentReference?: string;
  paidAt?: string;
  issuedAt: string;
  dueDate?: string;
  notes?: string;
  paymentTerms?: string;
  createdAt: string;
  referenceType?: string;
  referenceId?: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    customerId: string;
  };
  shipment?: {
    id: string;
    shipmentNumber: string;
    status: string;
    trackingNumber?: string;
    courierName?: string;
    costs: {
      shipping: number;
      insurance: number;
      handling: number;
      storage: number;
    };
    declaredValue: number;
    declaredCurrency: string;
  };
  shippingAddress?: {
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
  };
}

interface InvoiceDetailResponse {
  invoice: InvoiceDetail;
  lineItems: InvoiceLineItem[];
}

// Payment Status Badge Component
function PaymentStatusBadge({ status }: { status: string }) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', variant: 'secondary' as const, icon: Clock, color: 'text-yellow-600' };
      case 'paid':
        return { label: 'Paid', variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' };
      case 'partially_paid':
        return { label: 'Partially Paid', variant: 'outline' as const, icon: Clock, color: 'text-blue-600' };
      case 'overdue':
        return { label: 'Overdue', variant: 'destructive' as const, icon: AlertCircle, color: 'text-red-600' };
      case 'cancelled':
        return { label: 'Cancelled', variant: 'secondary' as const, icon: AlertCircle, color: 'text-gray-600' };
      case 'refunded':
        return { label: 'Refunded', variant: 'outline' as const, icon: AlertCircle, color: 'text-purple-600' };
      default:
        return { label: status, variant: 'outline' as const, icon: Clock, color: 'text-gray-600' };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

// Invoice Type Badge Component
function InvoiceTypeBadge({ type }: { type: string }) {
  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'shipping':
        return { label: 'Shipping', icon: Truck, color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'storage':
        return { label: 'Storage', icon: Package, color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'handling':
        return { label: 'Handling', icon: Receipt, color: 'bg-green-50 text-green-700 border-green-200' };
      case 'personal_shopper':
        return { label: 'Personal Shopping', icon: ShoppingCart, color: 'bg-orange-50 text-orange-700 border-orange-200' };
      case 'customs_duty':
        return { label: 'Customs & Duty', icon: Building, color: 'bg-red-50 text-red-700 border-red-200' };
      case 'insurance':
        return { label: 'Insurance', icon: FileText, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      default:
        return { label: type, icon: FileText, color: 'bg-gray-50 text-gray-700 border-gray-200' };
    }
  };

  const config = getTypeConfig(type);
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`flex items-center gap-1 ${config.color}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const invoiceId = params?.id as string;
  
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

  // Check for payment success/cancel status from URL
  const paymentStatus = searchParams?.get('payment');

  useEffect(() => {
    fetchInvoiceDetail();
  }, [invoiceId]);

  const fetchInvoiceDetail = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/customer/invoices/${invoiceId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch invoice details');
      }

      const data: InvoiceDetailResponse = await response.json();
      setInvoice(data.invoice);
      setLineItems(data.lineItems);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      // Show error toast/alert here
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayNow = async () => {
    try {
      setIsPaymentProcessing(true);
      const response = await fetch(`/api/customer/invoices/${invoiceId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to create payment session');
      }

      const data = await response.json();
      
      // Redirect to Stripe checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      setIsPaymentProcessing(false);
      // Show error toast/alert here
    }
  };

  const copyInvoiceNumber = () => {
    if (invoice) {
      navigator.clipboard.writeText(invoice.invoiceNumber);
      // Show success toast here
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="space-y-6 p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Invoice not found or you don't have permission to view it.
          </AlertDescription>
        </Alert>
        <Link href="/dashboard/invoices">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
        </Link>
      </div>
    );
  }

  const canPay = (invoice.paymentStatus === 'pending' || invoice.paymentStatus === 'overdue') && invoice.balanceDue > 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/invoices">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoice {invoice.invoiceNumber}</h1>
            <p className="text-gray-600">
              Issued on {format(new Date(invoice.issuedAt), 'MMMM dd, yyyy')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          {canPay && (
            <Button 
              size="sm"
              onClick={handlePayNow}
              disabled={isPaymentProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isPaymentProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay {invoice.currencyCode} {invoice.balanceDue.toFixed(2)}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Payment Status Alert */}
      {paymentStatus === 'success' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Payment successful! Your invoice has been paid and a receipt has been sent to your email.
          </AlertDescription>
        </Alert>
      )}

      {paymentStatus === 'cancelled' && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Payment was cancelled. You can try again by clicking the "Pay Now" button.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle>Invoice Details</CardTitle>
                  <InvoiceTypeBadge type={invoice.invoiceType} />
                  <PaymentStatusBadge status={invoice.paymentStatus} />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyInvoiceNumber}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Invoice Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Invoice Number:</span>
                      <span className="font-medium">{invoice.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Issue Date:</span>
                      <span>{format(new Date(invoice.issuedAt), 'MMM dd, yyyy')}</span>
                    </div>
                    {invoice.dueDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Due Date:</span>
                        <span>{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                    {invoice.paidAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Paid Date:</span>
                        <span>{format(new Date(invoice.paidAt), 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Customer Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Customer ID:</span>
                      <span className="font-medium">{invoice.customer.customerId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Name:</span>
                      <span>{invoice.customer.firstName} {invoice.customer.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email:</span>
                      <span>{invoice.customer.email}</span>
                    </div>
                  </div>
                </div>
              </div>

              {invoice.notes && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                  <p className="text-sm text-gray-600">{invoice.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Related Shipment */}
          {invoice.shipment && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Related Shipment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Shipment Number:</span>
                      <Link 
                        href={`/dashboard/shipments?search=${invoice.shipment.shipmentNumber}`}
                        className="font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        {invoice.shipment.shipmentNumber}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <Badge variant="outline">{invoice.shipment.status}</Badge>
                    </div>
                    {invoice.shipment.trackingNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tracking:</span>
                        <span className="font-medium">{invoice.shipment.trackingNumber}</span>
                      </div>
                    )}
                    {invoice.shipment.courierName && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Courier:</span>
                        <span>{invoice.shipment.courierName}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Declared Value:</span>
                      <span>{invoice.shipment.declaredCurrency} {invoice.shipment.declaredValue.toFixed(2)}</span>
                    </div>
                    {invoice.shipment.costs.shipping > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Shipping Cost:</span>
                        <span>{invoice.currencyCode} {invoice.shipment.costs.shipping.toFixed(2)}</span>
                      </div>
                    )}
                    {invoice.shipment.costs.insurance > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Insurance:</span>
                        <span>{invoice.currencyCode} {invoice.shipment.costs.insurance.toFixed(2)}</span>
                      </div>
                    )}
                    {invoice.shipment.costs.handling > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Handling Fee:</span>
                        <span>{invoice.currencyCode} {invoice.shipment.costs.handling.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium text-gray-900">Description</th>
                      <th className="text-right py-3 px-2 font-medium text-gray-900">Qty</th>
                      <th className="text-right py-3 px-2 font-medium text-gray-900">Unit Price</th>
                      <th className="text-right py-3 px-2 font-medium text-gray-900">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-3 px-2">
                          <div>
                            <p className="font-medium text-gray-900">{item.description}</p>
                            {item.referenceType && (
                              <p className="text-xs text-gray-500 mt-1">
                                Reference: {item.referenceType}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right">{item.quantity}</td>
                        <td className="py-3 px-2 text-right">
                          {invoice.currencyCode} {item.unitPrice.toFixed(2)}
                        </td>
                        <td className="py-3 px-2 text-right font-medium">
                          {invoice.currencyCode} {item.lineTotal.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          {invoice.shippingAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{invoice.shippingAddress.name}</p>
                  {invoice.shippingAddress.companyName && (
                    <p className="text-gray-600">{invoice.shippingAddress.companyName}</p>
                  )}
                  <p>{invoice.shippingAddress.addressLine1}</p>
                  {invoice.shippingAddress.addressLine2 && (
                    <p>{invoice.shippingAddress.addressLine2}</p>
                  )}
                  <p>
                    {invoice.shippingAddress.city}
                    {invoice.shippingAddress.stateProvince && `, ${invoice.shippingAddress.stateProvince}`} {invoice.shippingAddress.postalCode}
                  </p>
                  <p>{invoice.shippingAddress.countryCode}</p>
                  {invoice.shippingAddress.phone && (
                    <p className="flex items-center gap-1 mt-2">
                      <Phone className="h-3 w-3" />
                      {invoice.shippingAddress.phone}
                    </p>
                  )}
                  {invoice.shippingAddress.email && (
                    <p className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {invoice.shippingAddress.email}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Payment Summary */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal:</span>
                  <span>{invoice.currencyCode} {invoice.subtotal.toFixed(2)}</span>
                </div>
                
                {invoice.taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tax:</span>
                    <span>{invoice.currencyCode} {invoice.taxAmount.toFixed(2)}</span>
                  </div>
                )}
                
                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount:</span>
                    <span>-{invoice.currencyCode} {invoice.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between font-medium">
                  <span>Total Amount:</span>
                  <span>{invoice.currencyCode} {invoice.totalAmount.toFixed(2)}</span>
                </div>
                
                {invoice.paidAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Paid Amount:</span>
                    <span>{invoice.currencyCode} {invoice.paidAmount.toFixed(2)}</span>
                  </div>
                )}
                
                {invoice.balanceDue > 0 && (
                  <div className="flex justify-between font-medium text-red-600">
                    <span>Balance Due:</span>
                    <span>{invoice.currencyCode} {invoice.balanceDue.toFixed(2)}</span>
                  </div>
                )}
                
                {invoice.balanceDue <= 0 && invoice.paymentStatus === 'paid' && (
                  <div className="flex justify-between font-medium text-green-600">
                    <span>Status:</span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Fully Paid
                    </span>
                  </div>
                )}
              </div>

              {canPay && (
                <div className="mt-6">
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={handlePayNow}
                    disabled={isPaymentProcessing}
                  >
                    {isPaymentProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay Now
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Secure payment powered by Stripe
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Information */}
          {invoice.paymentMethod && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment Method:</span>
                    <span className="capitalize">{invoice.paymentMethod}</span>
                  </div>
                  {invoice.paymentReference && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Reference:</span>
                      <span className="font-mono text-xs">{invoice.paymentReference}</span>
                    </div>
                  )}
                  {invoice.paidAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Paid Date:</span>
                      <span>{format(new Date(invoice.paidAt), 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Terms */}
          {invoice.paymentTerms && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Terms</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{invoice.paymentTerms}</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Invoice
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Invoice Number
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}