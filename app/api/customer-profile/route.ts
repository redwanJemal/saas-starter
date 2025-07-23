import { getUserWithProfile } from '@/lib/db/queries';

export async function GET() {
  try {
    const userWithProfile = await getUserWithProfile();
    
    if (!userWithProfile) {
      return Response.json(null, { status: 401 });
    }

    // Return customer profile data
    return Response.json(userWithProfile);
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
