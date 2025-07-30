// app/admin/settings/couriers/[id]/edit/page.tsx
import { CourierFormClient } from '@/features/settings/components/courier-form-client';

// Use the RouteContext pattern for dynamic route params
interface RouteContext<T> {
  params: Promise<T>;
}

interface EditCourierPageProps extends RouteContext<{ id: string }> {}

export default async function EditCourierPage({ params }: EditCourierPageProps) {
  const { id } = await params;
  
  return <CourierFormClient courierId={id} />;
}