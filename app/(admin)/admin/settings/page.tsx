'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CountriesTab } from './components/countries-tab';
import { CurrenciesTab } from './components/currencies-tab';
import { CouriersTab } from './components/couriers-tab';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('countries');

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h2 className="text-xl font-semibold">Settings</h2>

      <Tabs defaultValue="countries" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="countries">Countries</TabsTrigger>
          <TabsTrigger value="currencies">Currencies</TabsTrigger>
          <TabsTrigger value="couriers">Couriers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="countries">
          <CountriesTab />
        </TabsContent>
        
        <TabsContent value="currencies">
          <CurrenciesTab />
        </TabsContent>
        
        <TabsContent value="couriers">
          <CouriersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
