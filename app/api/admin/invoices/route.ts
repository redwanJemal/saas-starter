import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { financialInvoices, customerProfiles, users, shipments } from '@/lib/db/schema';
import { desc, eq, ilike, or, sql } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('invoices.read');

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';

    const offset = (page - 1) * limit;

    // Build where conditions
    let whereConditions = [];

    if (search) {
      whereConditions.push(
        or(
          ilike(financialInvoices.invoiceNumber, `%${search}%`),
          ilike(users.email, `%${search}%`),
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName, `%${search}%`)
        )
      );
    }

    if (status) {
      whereConditions.push(eq(financialInvoices.paymentStatus, status as any));
    }

    if (type) {
      whereConditions.push(eq(financialInvoices.invoiceType, type as any));
    }

    // Combine conditions
    const whereClause = whereConditions.length > 0 
      ? sql`${whereConditions.reduce((acc, condition) => sql`${acc} AND ${condition}`)}` 
      : undefined;

    // Get invoices with related data
    const invoicesQuery = db
      .select({
        id: financialInvoices.id,
        invoiceNumber: financialInvoices.invoiceNumber,
        invoiceType: financialInvoices.invoiceType,
        paymentStatus: financialInvoices.paymentStatus,
        totalAmount: financialInvoices.totalAmount,
        currency: financialInvoices.currencyCode,
        taxAmount: financialInvoices.taxAmount,
        discountAmount: financialInvoices.discountAmount,
        dueDate: financialInvoices.dueDate,
        paidAt: financialInvoices.paidAt,
        issuedAt: financialInvoices.issuedAt,
        createdAt: financialInvoices.createdAt,
        customerName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        customerEmail: users.email,
        customerId: customerProfiles.customerId,
        shipmentId: shipments.id,
      })
      .from(financialInvoices)
      .innerJoin(customerProfiles, eq(financialInvoices.customerProfileId, customerProfiles.id))
      .innerJoin(users, eq(customerProfiles.userId, users.id))
      .leftJoin(shipments, eq(financialInvoices.referenceId, shipments.id))
      .orderBy(desc(financialInvoices.createdAt))
      .limit(limit)
      .offset(offset);

    if (whereClause) {
      invoicesQuery.where(whereClause);
    }

    const invoicesList = await invoicesQuery;

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(financialInvoices)
      .innerJoin(customerProfiles, eq(financialInvoices.customerProfileId, customerProfiles.id))
      .innerJoin(users, eq(customerProfiles.userId, users.id))
      .where(whereClause);

    return NextResponse.json({
      invoices: invoicesList,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching admin invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}