// app/(customer)/personal-shopping/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, ShoppingCart, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface PersonalShoppingRequest {
  id: string;
  requestNumber: string;
  status: string;
  estimatedCost: string;
  actualCost: string;
  totalAmount: string;
  currencyCode: string;
  quotedAt: string | null;
  approvedAt: string | null;
  purchasedAt: string | null;
  createdAt: string;
  items?: any[];
}

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: Clock },
  submitted: { label: 'Under Review', color: 'bg-blue-100 text-blue-800', icon: Clock },
  quoted: { label: 'Quote Ready', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  purchasing: { label: 'Purchasing', color: 'bg-purple-100 text-purple-800', icon: ShoppingCart },
  purchased: { label: 'Purchased', color: 'bg-indigo-100 text-indigo-800', icon: CheckCircle },
  received: { label: 'Received', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
};

export default function PersonalShoppingDashboard() {
  const [requests, setRequests] = useState<PersonalShoppingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const router = useRouter();
  // Using Sonner toast directly

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/personal-shopping/requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      } else {
        throw new Error('Failed to fetch requests');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to fetch personal shopping requests.');
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = (status?: string) => {
    if (!status || status === 'all') return requests;
    return requests.filter(request => request.status === status);
  };

  const getStatusCounts = () => {
    return {
      all: requests.length,
      draft: requests.filter(r => r.status === 'draft').length,
      submitted: requests.filter(r => r.status === 'submitted').length,
      quoted: requests.filter(r => r.status === 'quoted').length,
      approved: requests.filter(r => r.status === 'approved').length,
      active: requests.filter(r => ['purchasing', 'purchased', 'received'].includes(r.status)).length,
      completed: requests.filter(r => r.status === 'completed').length,
    };
  };

  const StatusIcon = ({ status }: { status: string }) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;
    const Icon = config.icon;
    return <Icon className="h-4 w-4" />;
  };

  const RequestCard = ({ request }: { request: PersonalShoppingRequest }) => {
    const config = statusConfig[request.status as keyof typeof statusConfig];
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{request.requestNumber}</CardTitle>
              <CardDescription>
                Created {new Date(request.createdAt).toLocaleDateString()}
              </CardDescription>
            </div>
            <Badge className={config?.color}>
              <StatusIcon status={request.status} />
              <span className="ml-1">{config?.label}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {request.totalAmount && parseFloat(request.totalAmount) > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Amount:</span>
                <span className="font-medium">
                  ${parseFloat(request.totalAmount).toFixed(2)} {request.currencyCode}
                </span>
              </div>
            )}
            {request.quotedAt && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Quoted:</span>
                <span className="text-sm">
                  {new Date(request.quotedAt).toLocaleDateString()}
                </span>
              </div>
            )}
            {request.purchasedAt && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Purchased:</span>
                <span className="text-sm">
                  {new Date(request.purchasedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              asChild
              className="flex-1"
            >
              <Link href={`/dashboard/personal-shopping/requests/${request.id}`}>
                <Eye className="h-4 w-4 mr-1" />
                View Details
              </Link>
            </Button>
            {request.status === 'quoted' && (
              <Button size="sm" className="flex-1">
                Review Quote
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const counts = getStatusCounts();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Personal Shopping</h1>
          <p className="text-gray-600">
            Request items from any store worldwide and we'll shop for you
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/personal-shopping/new">
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Link>
        </Button>
      </div>

      {requests.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No personal shopping requests yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start your first personal shopping request to buy items from any store worldwide
            </p>
            <Button asChild>
              <Link href="/dashboard/personal-shopping/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Request
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
            <TabsTrigger value="draft">Drafts ({counts.draft})</TabsTrigger>
            <TabsTrigger value="submitted">Pending ({counts.submitted})</TabsTrigger>
            <TabsTrigger value="quoted">Quotes ({counts.quoted})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({counts.approved})</TabsTrigger>
            <TabsTrigger value="active">Active ({counts.active})</TabsTrigger>
            <TabsTrigger value="completed">Done ({counts.completed})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterRequests().map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="draft" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterRequests('draft').map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="submitted" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterRequests('submitted').map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="quoted" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterRequests('quoted').map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="approved" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterRequests('approved').map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="active" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {['purchasing', 'purchased', 'received'].map(status => 
                filterRequests(status)
              ).flat().map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterRequests('completed').map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}