// app/api/customer/invoices/route.ts

import { db } from '@/lib/db/drizzle';
import { financialInvoices, financialInvoiceLines, shipments } from '@/lib/db/schema';
import { NextRequest, NextResponse } from 'next/server';
import { and, eq, desc, sql, ilike, or } from 'drizzle-orm';
import { getUserWithProfile } from '@/lib/db/queries';

interface InvoiceFilters {
  search?: string;
  paymentStatus?: string;
  invoiceType?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function GET(request: NextRequest) {
  try {
    const userWithProfile = await getUserWithProfile();
    if (!userWithProfile?.customerProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Filters
    const filters: InvoiceFilters = {
      search: searchParams.get('search') || undefined,
      paymentStatus: searchParams.get('paymentStatus') || undefined,
      invoiceType: searchParams.get('invoiceType') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
    };

    // Build where conditions
    const whereConditions = [
      eq(financialInvoices.customerProfileId, userWithProfile.customerProfile.id)
    ];

    if (filters.search) {
      whereConditions.push(
        or(
          ilike(financialInvoices.invoiceNumber, `%${filters.search}%`),
          ilike(financialInvoices.notes, `%${filters.search}%`)
        )!
      );
    }

    if (filters.paymentStatus) {
      whereConditions.push(eq(financialInvoices.paymentStatus, filters.paymentStatus as any));
    }

    if (filters.invoiceType) {
      whereConditions.push(eq(financialInvoices.invoiceType, filters.invoiceType as any));
    }

    if (filters.dateFrom) {
      whereConditions.push(sql`${financialInvoices.issuedAt} >= ${filters.dateFrom}`);
    }

    if (filters.dateTo) {
      whereConditions.push(sql`${financialInvoices.issuedAt} <= ${filters.dateTo}`);
    }

    const whereClause = whereConditions.length > 1 
      ? and(...whereConditions)
      : whereConditions[0];

    // Get invoices with shipment data
    const invoicesQuery = await db
      .select({
        id: financialInvoices.id,
        invoiceNumber: financialInvoices.invoiceNumber,
        invoiceType: financialInvoices.invoiceType,
        paymentStatus: financialInvoices.paymentStatus,
        subtotal: financialInvoices.subtotal,
        taxAmount: financialInvoices.taxAmount,
        discountAmount: financialInvoices.discountAmount,
        totalAmount: financialInvoices.totalAmount,
        currencyCode: financialInvoices.currencyCode,
        paidAmount: financialInvoices.paidAmount,
        paymentMethod: financialInvoices.paymentMethod,
        paymentReference: financialInvoices.paymentReference,
        paidAt: financialInvoices.paidAt,
        issuedAt: financialInvoices.issuedAt,
        dueDate: financialInvoices.dueDate,
        notes: financialInvoices.notes,
        createdAt: financialInvoices.createdAt,
        // Shipment data (if linked)
        shipmentId: shipments.id,
        shipmentNumber: shipments.shipmentNumber,
        shipmentStatus: shipments.status,
      })
      .from(financialInvoices)
      .leftJoin(shipments, eq(financialInvoices.referenceId, shipments.id))
      .where(whereClause)
      .orderBy(desc(financialInvoices.issuedAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(financialInvoices)
      .where(whereClause);

    // Calculate summary stats
    const summaryQuery = await db
      .select({
        totalInvoices: sql<number>`count(*)`,
        totalAmount: sql<number>`sum(${financialInvoices.totalAmount})`,
        totalPaid: sql<number>`sum(${financialInvoices.paidAmount})`,
        pendingCount: sql<number>`count(case when ${financialInvoices.paymentStatus} = 'pending' then 1 end)`,
        pendingAmount: sql<number>`sum(case when ${financialInvoices.paymentStatus} = 'pending' then ${financialInvoices.totalAmount} else 0 end)`,
        overdueCount: sql<number>`count(case when ${financialInvoices.paymentStatus} = 'overdue' then 1 end)`,
        overdueAmount: sql<number>`sum(case when ${financialInvoices.paymentStatus} = 'overdue' then ${financialInvoices.totalAmount} else 0 end)`,
      })
      .from(financialInvoices)
      .where(eq(financialInvoices.customerProfileId, userWithProfile.customerProfile.id));

    const summary = summaryQuery[0];

    return NextResponse.json({
      invoices: invoicesQuery,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
      summary: {
        totalInvoices: summary.totalInvoices || 0,
        totalAmount: parseFloat(summary.totalAmount?.toString() || '0'),
        totalPaid: parseFloat(summary.totalPaid?.toString() || '0'),
        pendingCount: summary.pendingCount || 0,
        pendingAmount: parseFloat(summary.pendingAmount?.toString() || '0'),
        overdueCount: summary.overdueCount || 0,
        overdueAmount: parseFloat(summary.overdueAmount?.toString() || '0'),
      },
    });

  } catch (error) {
    console.error('Error fetching customer invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}