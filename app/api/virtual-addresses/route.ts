import { getCustomerVirtualAddresses, getUserWithProfile } from '@/lib/db/queries';

export async function GET() {
  try {
    const userWithProfile = await getUserWithProfile();
    
    if (!userWithProfile?.customerProfile) {
      return Response.json(null, { status: 401 });
    }

    const virtualAddresses = await getCustomerVirtualAddresses(userWithProfile.customerProfile.id);
    
    return Response.json(virtualAddresses);
  } catch (error) {
    console.error('Error fetching virtual addresses:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
