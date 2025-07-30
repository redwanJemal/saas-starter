// app/admin/settings/currencies/[id]/edit/page.tsx
import { CurrencyFormClient } from '@/features/settings/components/currency-form-client';

// Use the RouteContext pattern for dynamic route params
interface RouteContext<T> {
  params: Promise<T>;
}

interface EditCurrencyPageProps extends RouteContext<{ id: string }> {}

export default async function EditCurrencyPage({ params }: EditCurrencyPageProps) {
  const { id } = await params;
  
  return <CurrencyFormClient currencyId={id} />;
}