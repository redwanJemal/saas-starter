import { getCustomerDashboardStats, getUserWithProfile } from '@/lib/db/queries';

export async function GET() {
  try {
    const userWithProfile = await getUserWithProfile();
    
    if (!userWithProfile?.customerProfile) {
      return Response.json(null, { status: 401 });
    }

    const stats = await getCustomerDashboardStats(userWithProfile.customerProfile.id);
    
    return Response.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
