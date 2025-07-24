import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users, userRoles, roles } from '@/lib/db/schema';
import { desc, eq, ilike, or, sql } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('users.manage');

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const userType = searchParams.get('user_type') || '';
    const status = searchParams.get('status') || '';

    const offset = (page - 1) * limit;

    // Build where conditions
    let whereConditions = [];

    if (search) {
      whereConditions.push(
        or(
          ilike(users.email, `%${search}%`),
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName, `%${search}%`)
        )
      );
    }

    if (userType) {
      whereConditions.push(eq(users.userType, userType as any));
    }

    if (status) {
      whereConditions.push(eq(users.status, status as any));
    }

    // Combine conditions
    const whereClause = whereConditions.length > 0 
      ? sql`${whereConditions.reduce((acc, condition) => sql`${acc} AND ${condition}`)}` 
      : undefined;

    // Get users with their roles
    const usersQuery = db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        userType: users.userType,
        status: users.status,
        emailVerifiedAt: users.emailVerifiedAt,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        roleName: roles.name,
        roleSlug: roles.slug,
      })
      .from(users)
      .leftJoin(userRoles, eq(users.id, userRoles.userId))
      .leftJoin(roles, eq(userRoles.roleId, roles.id))
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    if (whereClause) {
      usersQuery.where(whereClause);
    }

    const usersList = await usersQuery;

    // Group users by ID to handle multiple roles
    const usersMap = new Map();
    usersList.forEach(user => {
      if (!usersMap.has(user.id)) {
        usersMap.set(user.id, {
          ...user,
          roles: []
        });
      }
      if (user.roleName) {
        usersMap.get(user.id).roles.push({
          name: user.roleName,
          slug: user.roleSlug
        });
      }
    });

    const usersWithRoles = Array.from(usersMap.values());

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(DISTINCT ${users.id})` })
      .from(users)
      .where(whereClause);

    return NextResponse.json({
      users: usersWithRoles,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}