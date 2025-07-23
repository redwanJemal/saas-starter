import { getUserWithProfile } from '@/lib/db/queries';

export async function GET() {
  // Return customer profile for compatibility with existing code
  const userWithProfile = await getUserWithProfile();
  return Response.json(userWithProfile?.customerProfile || null);
}