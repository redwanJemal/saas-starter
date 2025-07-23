import { getCustomerShipments, getUserWithProfile } from '@/lib/db/queries';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const userWithProfile = await getUserWithProfile();
    
    if (!userWithProfile?.customerProfile) {
      return Response.json(null, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const shipments = await getCustomerShipments(userWithProfile.customerProfile.id, limit);
    
    return Response.json(shipments);
  } catch (error) {
    console.error('Error fetching shipments:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
