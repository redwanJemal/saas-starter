import { getUser } from '@/lib/db/queries';

export async function GET() {
  try {
    const user = await getUser();
    
    if (!user) {
      return Response.json(null, { status: 401 });
    }

    // Return user data without sensitive information
    const { passwordHash, ...safeUser } = user;
    
    return Response.json(safeUser);
  } catch (error) {
    console.error('Error fetching user:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
