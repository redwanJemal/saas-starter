// features/shipping/components/shipping-recent-activity.tsx

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, DollarSign, Edit, Plus, Trash2, Calendar } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'zone_created' | 'zone_updated' | 'rate_created' | 'rate_updated' | 'rate_deleted';
  description: string;
  timestamp: string;
  user?: string;
  metadata?: {
    zoneName?: string;
    warehouseName?: string;
    serviceType?: string;
  };
}

interface ShippingRecentActivityProps {
  activities: ActivityItem[];
  isLoading?: boolean;
}

export function ShippingRecentActivity({ activities, isLoading }: ShippingRecentActivityProps) {
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'zone_created':
        return <Globe className="h-4 w-4 text-green-600" />;
      case 'zone_updated':
        return <Globe className="h-4 w-4 text-blue-600" />;
      case 'rate_created':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'rate_updated':
        return <DollarSign className="h-4 w-4 text-blue-600" />;
      case 'rate_deleted':
        return <DollarSign className="h-4 w-4 text-red-600" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityBadge = (type: ActivityItem['type']) => {
    switch (type) {
      case 'zone_created':
      case 'rate_created':
        return <Badge variant="default" className="text-xs bg-green-100 text-green-800 border-green-200">Created</Badge>;
      case 'zone_updated':
      case 'rate_updated':
        return <Badge variant="default" className="text-xs bg-blue-100 text-blue-800 border-blue-200">Updated</Badge>;
      case 'rate_deleted':
        return <Badge variant="destructive" className="text-xs">Deleted</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Activity</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 pb-4 border-b last:border-b-0 last:pb-0">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.description}
                    </p>
                    {getActivityBadge(activity.type)}
                  </div>
                  
                  {activity.metadata && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {activity.metadata.zoneName && (
                        <Badge variant="outline" className="text-xs">
                          <Globe className="h-3 w-3 mr-1" />
                          {activity.metadata.zoneName}
                        </Badge>
                      )}
                      {activity.metadata.warehouseName && (
                        <Badge variant="outline" className="text-xs">
                          {activity.metadata.warehouseName}
                        </Badge>
                      )}
                      {activity.metadata.serviceType && (
                        <Badge variant="outline" className="text-xs">
                          {activity.metadata.serviceType}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatTimestamp(activity.timestamp)}</span>
                    {activity.user && (
                      <span>by {activity.user}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}