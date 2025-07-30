'use client';

import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

interface ActivityItem {
  id: string;
  description: string;
  timestamp: string;
  user: string;
}

interface WarehouseActivityTabProps {
  warehouseId: string;
  activities?: ActivityItem[];
}

export function WarehouseActivityTab({ warehouseId, activities = [] }: WarehouseActivityTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 border-l-2 border-gray-200">
                <div className="p-1 bg-blue-100 rounded">
                  <Activity className="h-3 w-3 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm">{activity.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-gray-500">{activity.timestamp}</p>
                    {activity.user && (
                      <>
                        <span className="text-xs text-gray-400">•</span>
                        <p className="text-xs text-gray-500">by {activity.user}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No recent activity found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
