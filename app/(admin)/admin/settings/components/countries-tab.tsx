'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CountryForm } from './country-form';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

interface Country {
  id: string;
  code: string;
  name: string;
  region?: string;
  subregion?: string;
  isActive: boolean;
  isShippingEnabled: boolean;
  requiresPostalCode: boolean;
  requiresStateProvince: boolean;
  euMember: boolean;
  customsFormType?: string;
  flagEmoji?: string;
  phonePrefix?: string;
  createdAt: string;
  updatedAt: string;
}

export function CountriesTab() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchCountries = async (page = 1, limit = 20, search = '') => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (search) {
        params.append('search', search);
      }
      
      const response = await fetch(`/api/admin/master-data/countries?${params.toString()}`);
      const data = await response.json();
      
      if (response.ok) {
        setCountries(data.countries);
        setPagination(data.pagination);
      } else {
        throw new Error(data.error || 'Failed to fetch countries');
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
      toast.error('Failed to fetch countries. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCountries(pagination.page, pagination.limit);
  }, []);

  const handlePaginationChange = (page: number, limit: number) => {
    fetchCountries(page, limit);
  };

  const handleCreateSuccess = () => {
    setIsDialogOpen(false);
    fetchCountries(1, pagination.limit);
    toast.success('Country created successfully');
  };

  const columns: ColumnDef<Country>[] = [
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
      accessorKey: 'region',
      header: 'Region',
    },
    {
      accessorKey: 'flagEmoji',
      header: 'Flag',
      cell: ({ row }) => <div className="text-xl">{row.getValue('flagEmoji') || ''}</div>,
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
    {
      accessorKey: 'isShippingEnabled',
      header: 'Shipping',
      cell: ({ row }) => (
        <div className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${
          row.getValue('isShippingEnabled') ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {row.getValue('isShippingEnabled') ? 'Enabled' : 'Disabled'}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Countries</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Country
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Country</DialogTitle>
            </DialogHeader>
            <CountryForm onSuccess={handleCreateSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        columns={columns}
        data={countries}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Search countries..."
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        onRefresh={() => fetchCountries(pagination.page, pagination.limit)}
        emptyMessage="No countries found."
      />
    </div>
  );
}
