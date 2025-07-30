'use client';

import { CountryForm } from './country-form';
import { useCountry } from '@/features/settings/hooks/use-settings-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface CountryFormClientProps {
  countryId: string;
}

export function CountryFormClient({ countryId }: CountryFormClientProps) {
  const { data: country, isLoading, error } = useCountry(countryId);

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

  if (error || !country) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Country not found
          </h3>
          <p className="text-gray-600 text-center">
            The country you're looking for doesn't exist or has been deleted.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <CountryForm country={country} mode="edit" />;
}
