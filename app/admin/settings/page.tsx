// app/admin/settings/page.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, DollarSign, Truck, Settings, Flag, CreditCard, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useCountries, useCurrencies, useCouriers } from '@/features/settings/hooks/use-settings-query';

const settingsCategories = [
  {
    title: 'Countries',
    description: 'Manage supported countries and shipping destinations',
    icon: Globe,
    href: '/admin/settings/countries',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    title: 'Currencies',
    description: 'Configure supported currencies and exchange rates',
    icon: DollarSign,
    href: '/admin/settings/currencies',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    title: 'Couriers',
    description: 'Set up courier services and shipping integrations',
    icon: Truck,
    href: '/admin/settings/couriers',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
];

export default function SettingsPage() {
  const { data: countriesResponse } = useCountries();
  const { data: currenciesResponse } = useCurrencies();
  const { data: couriersResponse } = useCouriers();

  const stats = [
    {
      title: 'Countries',
      value: countriesResponse?.data?.length || 0,
      icon: Flag,
      color: 'text-blue-600',
    },
    {
      title: 'Currencies',
      value: currenciesResponse?.data?.length || 0,
      icon: CreditCard,
      color: 'text-green-600',
    },
    {
      title: 'Couriers',
      value: couriersResponse?.data?.length || 0,
      icon: ShoppingBag,
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Settings className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-gray-600 mt-2">
          Configure global settings and manage master data for your platform
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Settings Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {settingsCategories.map((category) => {
          const Icon = category.icon;
          return (
            <Card key={category.title} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${category.bgColor} flex items-center justify-center mb-4`}>
                  <Icon className={`h-6 w-6 ${category.color}`} />
                </div>
                <CardTitle className="text-xl">{category.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{category.description}</p>
                <Link href={category.href}>
                  <Button className="w-full">
                    Manage {category.title}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}