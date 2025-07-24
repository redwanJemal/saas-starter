// app/api/customer/dashboard-stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserWithProfile } from '@/lib/db/queries';
import { getEnhancedCustomerDashboardStats } from '@/lib/db/queries-customer-enhanced';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user and customer profile
    const userWithProfile = await getUserWithProfile();
    if (!userWithProfile?.customerProfile) {
      return NextResponse.json(
        { error: 'Unauthorized - Customer profile required' },
        { status: 401 }
      );
    }

    const customerId = userWithProfile.customerProfile.id;
    const stats = await getEnhancedCustomerDashboardStats(customerId);

    return NextResponse.json({
      stats,
      success: true,
    });

  } catch (error) {
    console.error('Error fetching customer dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}