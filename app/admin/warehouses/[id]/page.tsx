// app/admin/warehouses/[id]/page.tsx

import { WarehouseDetailClient } from '@/features/warehouses/components/warehouse-detail-client';

// Use the RouteContext pattern for dynamic route params
interface RouteContext<T> {
  params: Promise<T>;
}

interface WarehouseDetailPageProps extends RouteContext<{ id: string }> {}

export default async function WarehouseDetailPage({ params }: WarehouseDetailPageProps) {
  const { id } = await params;
  
  return <WarehouseDetailClient warehouseId={id} />;
}