import { getCustomerPackages, getUserWithProfile } from '@/lib/db/queries';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const userWithProfile = await getUserWithProfile();
    
    if (!userWithProfile?.customerProfile) {
      return Response.json(null, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const packages = await getCustomerPackages(userWithProfile.customerProfile.id, limit);
    
    return Response.json(packages);
  } catch (error) {
    console.error('Error fetching packages:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
