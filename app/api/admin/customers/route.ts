import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { customerProfiles, users } from '@/lib/db/schema';
import { desc, eq, ilike, or, sql } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('customers.read');

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const kycStatus = searchParams.get('kyc_status') || '';

    const offset = (page - 1) * limit;

    // Build where conditions
    let whereConditions = [];
    
    if (search) {
      whereConditions.push(
        or(
          ilike(customerProfiles.customerId, `%${search}%`),
          ilike(users.email, `%${search}%`),
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName, `%${search}%`)
        )
      );
    }

    if (kycStatus) {
      whereConditions.push(eq(customerProfiles.kycStatus, kycStatus as any));
    }

    // Combine conditions
    const whereClause = whereConditions.length > 0 
      ? sql`${whereConditions.reduce((acc, condition) => sql`${acc} AND ${condition}`)}` 
      : undefined;

    // Get customers with user data
    const customersQuery = db
      .select({
        id: customerProfiles.id,
        customerId: customerProfiles.customerId,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        kycStatus: customerProfiles.kycStatus,
        riskLevel: customerProfiles.riskLevel,
        totalSpent: customerProfiles.totalSpent,
        totalPackages: customerProfiles.totalPackages,
        totalShipments: customerProfiles.totalShipments,
        createdAt: customerProfiles.createdAt,
        lastLoginAt: users.lastLoginAt,
        status: users.status,
      })
      .from(customerProfiles)
      .innerJoin(users, eq(customerProfiles.userId, users.id))
      .orderBy(desc(customerProfiles.createdAt))
      .limit(limit)
      .offset(offset);

    if (whereClause) {
      customersQuery.where(whereClause);
    }

    const customersList = await customersQuery;

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(customerProfiles)
      .innerJoin(users, eq(customerProfiles.userId, users.id))
      .where(whereClause);

    return NextResponse.json({
      customers: customersList,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching admin customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}