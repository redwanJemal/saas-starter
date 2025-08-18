'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CourierForm } from './courier-form';
import { ColumnDef } from '@tanstack/react-table';

interface Courier {
  id: string;
  code: string;
  name: string;
  website?: string;
  trackingUrlTemplate?: string;
  isActive: boolean;
  apiCredentials?: any;
  integrationSettings?: any;
  createdAt: string;
  updatedAt: string;
}

export function CouriersTab() {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchCouriers = async (page = 1, limit = 20, search = '') => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (search) {
        params.append('search', search);
      }
      
      const response = await fetch(`/api/admin/master-data/couriers?${params.toString()}`);
      const data = await response.json();
      
      if (response.ok) {
        setCouriers(data.couriers);
        setPagination(data.pagination);
      } else {
        throw new Error(data.error || 'Failed to fetch couriers');
      }
    } catch (error) {
      console.error('Error fetching couriers:', error);
      toast.error('Failed to fetch couriers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCouriers(pagination.page, pagination.limit);
  }, []);

  const handlePaginationChange = (page: number, limit: number) => {
    fetchCouriers(page, limit);
  };

  const handleCreateSuccess = () => {
    setIsDialogOpen(false);
    fetchCouriers(1, pagination.limit);
    toast('Courier created successfully');
  };

  const columns: ColumnDef<Courier>[] = [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => <div className="uppercase font-medium">{row.getValue('code')}</div>,
    },
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'website',
      header: 'Website',
      cell: ({ row }) => {
        const website = row.getValue('website') as string;
        return website ? (
          <a 
            href={website} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {website}
          </a>
        ) : null;
      },
    },
    {
      accessorKey: 'trackingUrlTemplate',
      header: 'Tracking URL Template',
      cell: ({ row }) => {
        const template = row.getValue('trackingUrlTemplate') as string;
        return template ? (
          <div className="max-w-[200px] truncate" title={template}>
            {template}
          </div>
        ) : null;
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <div className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${
          row.getValue('isActive') ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {row.getValue('isActive') ? 'Active' : 'Inactive'}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Couriers</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Courier
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Courier</DialogTitle>
            </DialogHeader>
            <CourierForm onSuccess={handleCreateSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        columns={columns}
        data={couriers}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Search couriers..."
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        onRefresh={() => fetchCouriers(pagination.page, pagination.limit)}
        emptyMessage="No couriers found."
      />
    </div>
  );
}
