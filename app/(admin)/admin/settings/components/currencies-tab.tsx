'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CurrencyForm } from './currency-form';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  isActive: boolean;
  decimalPlaces: number;
  symbolPosition: string;
  createdAt: string;
  updatedAt: string;
}

export function CurrenciesTab() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchCurrencies = async (page = 1, limit = 20, search = '') => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (search) {
        params.append('search', search);
      }
      
      const response = await fetch(`/api/admin/master-data/currencies?${params.toString()}`);
      const data = await response.json();
      
      if (response.ok) {
        setCurrencies(data.currencies);
        setPagination(data.pagination);
      } else {
        throw new Error(data.error || 'Failed to fetch currencies');
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch currencies');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrencies(pagination.page, pagination.limit);
  }, []);

  const handlePaginationChange = (page: number, limit: number) => {
    fetchCurrencies(page, limit);
  };

  const handleCreateSuccess = () => {
    setIsDialogOpen(false);
    fetchCurrencies(1, pagination.limit);
    toast('Currency created successfully');
  };

  const columns: ColumnDef<Currency>[] = [
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
      accessorKey: 'symbol',
      header: 'Symbol',
    },
    {
      accessorKey: 'decimalPlaces',
      header: 'Decimal Places',
    },
    {
      accessorKey: 'symbolPosition',
      header: 'Symbol Position',
      cell: ({ row }) => {
        const position = row.getValue('symbolPosition') as string;
        return position === 'before' ? 'Before (e.g., $100)' : 'After (e.g., 100€)';
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
        <h2 className="text-xl font-semibold">Currencies</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Currency
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Currency</DialogTitle>
            </DialogHeader>
            <CurrencyForm onSuccess={handleCreateSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        columns={columns}
        data={currencies}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Search currencies..."
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        onRefresh={() => fetchCurrencies(pagination.page, pagination.limit)}
        emptyMessage="No currencies found."
      />
    </div>
  );
}
