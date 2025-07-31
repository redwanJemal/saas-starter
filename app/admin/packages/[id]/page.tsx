// app/admin/packages/[id]/page.tsx
import { PackageDetailClient } from '@/features/packages/components/package-detail-client';
import { RouteContext } from '@/lib/types/route';

interface PackageDetailPageProps extends RouteContext<{ id: string }> {}

export default async function PackageDetailPage({ params }: PackageDetailPageProps) {
  const { id } = await params;
  
  return <PackageDetailClient packageId={id} />;
}