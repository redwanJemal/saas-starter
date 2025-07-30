// app/admin/settings/countries/[id]/edit/page.tsx
import { CountryFormClient } from '@/features/settings/components/country-form-client';

// Use the RouteContext pattern for dynamic route params
interface RouteContext<T> {
  params: Promise<T>;
}

interface EditCountryPageProps extends RouteContext<{ id: string }> {}

export default async function EditCountryPage({ params }: EditCountryPageProps) {
  const { id } = await params;
  
  return <CountryFormClient countryId={id} />;
}
