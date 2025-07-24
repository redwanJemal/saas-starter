import { getUserWithProfile, getUser } from '@/lib/db/queries';

export async function GET() {
  try {
    const user = await getUser();
    
    if (!user) {
      return Response.json(null, { status: 401 });
    }

    // If user is not a customer, return null (they don't have a customer profile)
    if (user.userType !== 'customer') {
      return Response.json(null, { status: 200 });
    }

    const userWithProfile = await getUserWithProfile();
    
    if (!userWithProfile?.customerProfile) {
      return Response.json(null, { status: 200 });
    }

    // Ensure all data is properly serializable
    const safeCustomerProfile = {
      id: userWithProfile.customerProfile.id,
      customerId: userWithProfile.customerProfile.customerId,
      totalSpent: userWithProfile.customerProfile.totalSpent?.toString() || '0.00',
      totalPackages: userWithProfile.customerProfile.totalPackages || 0,
      totalShipments: userWithProfile.customerProfile.totalShipments || 0,
      kycStatus: userWithProfile.customerProfile.kycStatus,
      riskLevel: userWithProfile.customerProfile.riskLevel,
      createdAt: userWithProfile.customerProfile.createdAt.toISOString(),
      updatedAt: userWithProfile.customerProfile.updatedAt.toISOString(),
    };

    return Response.json(safeCustomerProfile);
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}