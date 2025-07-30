'use client';

import { CurrencyForm } from './currency-form';
import { useCurrency } from '@/features/settings/hooks/use-settings-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface CurrencyFormClientProps {
  currencyId: string;
}

export function CurrencyFormClient({ currencyId }: CurrencyFormClientProps) {
  const { data: currency, isLoading, error } = useCurrency(currencyId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-32" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !currency) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Currency not found
          </h3>
          <p className="text-gray-600 text-center">
            The currency you're looking for doesn't exist or has been deleted.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <CurrencyForm currency={currency} mode="edit" />;
}
