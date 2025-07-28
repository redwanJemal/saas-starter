// app/api/admin/personal-shopping/requests/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { 
  personalShopperRequests, 
  personalShopperRequestItems,
  customerProfiles,
  users 
} from '@/lib/db/schema';
import { requirePermission } from '@/lib/auth/admin';
import { eq, desc, ilike, or, sql, count } from 'drizzle-orm';

// GET /api/admin/personal-shopping/requests - Get all requests with filters
export async function GET(request: NextRequest) {
  try {
    const adminUser = await requirePermission('personal_shopping.read');
    
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    const offset = (page - 1) * limit;

    // Build base query with customer details
    let query = db
      .select({
        id: personalShopperRequests.id,
        requestNumber: personalShopperRequests.requestNumber,
        status: personalShopperRequests.status,
        customerName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        customerEmail: users.email,
        customerId: customerProfiles.customerId,
        estimatedCost: personalShopperRequests.estimatedCost,
        actualCost: personalShopperRequests.actualCost,
        totalAmount: personalShopperRequests.totalAmount,
        currencyCode: personalShopperRequests.currencyCode,
        itemCount: sql<number>`(
          SELECT COUNT(*) 
          FROM ${personalShopperRequestItems} 
          WHERE ${personalShopperRequestItems.personalShopperRequestId} = ${personalShopperRequests.id}
        )`,
        quotedAt: personalShopperRequests.quotedAt,
        approvedAt: personalShopperRequests.approvedAt,
        purchasedAt: personalShopperRequests.purchasedAt,
        createdAt: personalShopperRequests.createdAt,
        updatedAt: personalShopperRequests.updatedAt,
      })
      .from(personalShopperRequests)
      .innerJoin(customerProfiles, eq(personalShopperRequests.customerProfileId, customerProfiles.id))
      .innerJoin(users, eq(customerProfiles.userId, users.id));

    // Apply filters
    const whereConditions = [];
    
    if (status) {
      whereConditions.push(eq(personalShopperRequests.status, status as any));
    }
    
    if (search) {
      whereConditions.push(
        or(
          ilike(personalShopperRequests.requestNumber, `%${search}%`),
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName, `%${search}%`),
          ilike(users.email, `%${search}%`),
          ilike(customerProfiles.customerId, `%${search}%`)
        )
      );
    }

    if (whereConditions.length > 0) {
      query.where(sql`${whereConditions.reduce((acc, condition) => sql`${acc} AND ${condition}`)}`);
    }

    // Get total count
    const [totalCount] = await db
      .select({ count: count() })
      .from(personalShopperRequests)
      .innerJoin(customerProfiles, eq(personalShopperRequests.customerProfileId, customerProfiles.id))
      .innerJoin(users, eq(customerProfiles.userId, users.id))
      .where(whereConditions.length > 0 ? 
        sql`${whereConditions.reduce((acc, condition) => sql`${acc} AND ${condition}`)}` : 
        undefined
      );

    // Apply pagination and ordering
    const requests = await query
      .orderBy(desc(personalShopperRequests.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      requests,
      pagination: {
        page,
        limit,
        total: totalCount?.count || 0,
        totalPages: Math.ceil((totalCount?.count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching personal shopping requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}