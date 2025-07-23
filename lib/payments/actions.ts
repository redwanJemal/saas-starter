'use server';

import { redirect } from 'next/navigation';
import { createCheckoutSession, createCustomerPortalSession } from './stripe';
import { getUserWithProfile } from '@/lib/db/queries';

export async function checkoutAction(formData: FormData) {
  const priceId = formData.get('priceId') as string;
  
  const userWithProfile = await getUserWithProfile();
  
  if (!userWithProfile?.customerProfile) {
    redirect(`/sign-up?redirect=checkout&priceId=${priceId}`);
  }

  await createCheckoutSession({
    customerProfile: userWithProfile.customerProfile,
    priceId
  });
}

export async function customerPortalAction() {
  const userWithProfile = await getUserWithProfile();
  
  if (!userWithProfile?.customerProfile) {
    redirect('/pricing');
  }

  const portalSession = await createCustomerPortalSession(userWithProfile.customerProfile);
  redirect(portalSession.url);
}