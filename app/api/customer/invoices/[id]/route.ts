// app/api/customer/invoices/[id]/route.ts

import { db } from '@/lib/db/drizzle';
import { financialInvoices, financialInvoiceLines, shipments, customerProfiles, users, addresses } from '@/lib/db/schema';
import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { getUserWithProfile } from '@/lib/db/queries';
import { RouteContext } from '@/lib/utils/route';

export async function GET(
  request: NextRequest,
  RouteContext: RouteContext<{ id: string }>
) {
  try {
    const userWithProfile = await getUserWithProfile();
    if (!userWithProfile?.customerProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoiceId = (await RouteContext.params).id;

    // Get invoice details with related data
    const invoiceQuery = await db
      .select({
        // Invoice data
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
        paymentTerms: financialInvoices.paymentTerms,
        createdAt: financialInvoices.createdAt,
        referenceType: financialInvoices.referenceType,
        referenceId: financialInvoices.referenceId,
        // Customer data
        customerFirstName: users.firstName,
        customerLastName: users.lastName,
        customerEmail: users.email,
        customerId: customerProfiles.customerId,
        // Shipment data (if linked)
        shipmentId: shipments.id,
        shipmentNumber: shipments.shipmentNumber,
        shipmentStatus: shipments.status,
        trackingNumber: shipments.trackingNumber,
        courierName: shipments.carrierReference,
        shippingCost: shipments.shippingCost,
        insuranceCost: shipments.insuranceCost,
        handlingFee: shipments.handlingFee,
        storageFee: shipments.storageFee,
        declaredValue: shipments.shippingCost,
        declaredCurrency: shipments.costCurrency,
      })
      .from(financialInvoices)
      .innerJoin(customerProfiles, eq(financialInvoices.customerProfileId, customerProfiles.id))
      .innerJoin(users, eq(customerProfiles.userId, users.id))
      .leftJoin(shipments, eq(financialInvoices.referenceId, shipments.id))
      .where(
        and(
          eq(financialInvoices.id, invoiceId),
          eq(financialInvoices.customerProfileId, userWithProfile.customerProfile.id)
        )
      )
      .limit(1);

    if (invoiceQuery.length === 0) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    const invoice = invoiceQuery[0];

    // Get invoice line items
    const lineItemsQuery = await db
      .select({
        id: financialInvoiceLines.id,
        description: financialInvoiceLines.description,
        quantity: financialInvoiceLines.quantity,
        unitPrice: financialInvoiceLines.unitPrice,
        lineTotal: financialInvoiceLines.lineTotal,
        taxRate: financialInvoiceLines.taxRate,
        taxAmount: financialInvoiceLines.taxAmount,
        referenceType: financialInvoiceLines.referenceType,
        referenceId: financialInvoiceLines.referenceId,
        sortOrder: financialInvoiceLines.sortOrder,
      })
      .from(financialInvoiceLines)
      .where(eq(financialInvoiceLines.invoiceId, invoiceId))
      .orderBy(financialInvoiceLines.sortOrder);

    // Get shipping address if this is a shipment invoice
    let shippingAddress = null;
    if (invoice.shipmentId) {
      const addressQuery = await db
        .select({
          name: addresses.name,
          companyName: addresses.companyName,
          addressLine1: addresses.addressLine1,
          addressLine2: addresses.addressLine2,
          city: addresses.city,
          stateProvince: addresses.stateProvince,
          postalCode: addresses.postalCode,
          countryCode: addresses.countryCode,
          phone: addresses.phone,
          email: addresses.email,
        })
        .from(addresses)
        .innerJoin(shipments, eq(addresses.id, shipments.shippingAddressId))
        .where(eq(shipments.id, invoice.shipmentId))
        .limit(1);

      shippingAddress = addressQuery[0] || null;
    }

    // Format the response
    const response = {
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceType: invoice.invoiceType,
        paymentStatus: invoice.paymentStatus,
        subtotal: parseFloat(invoice.subtotal || '0'),
        taxAmount: parseFloat(invoice.taxAmount || '0'),
        discountAmount: parseFloat(invoice.discountAmount || '0'),
        totalAmount: parseFloat(invoice.totalAmount || '0'),
        currencyCode: invoice.currencyCode,
        paidAmount: parseFloat(invoice.paidAmount || '0'),
        balanceDue: parseFloat(invoice.totalAmount || '0') - parseFloat(invoice.paidAmount || '0'),
        paymentMethod: invoice.paymentMethod,
        paymentReference: invoice.paymentReference,
        paidAt: invoice.paidAt?.toISOString(),
        issuedAt: invoice.issuedAt?.toISOString(),
        dueDate: invoice.dueDate?.toISOString(),
        notes: invoice.notes,
        paymentTerms: invoice.paymentTerms,
        createdAt: invoice.createdAt?.toISOString(),
        referenceType: invoice.referenceType,
        referenceId: invoice.referenceId,
        // Customer info
        customer: {
          firstName: invoice.customerFirstName,
          lastName: invoice.customerLastName,
          email: invoice.customerEmail,
          customerId: invoice.customerId,
        },
        // Shipment info (if applicable)
        shipment: invoice.shipmentId ? {
          id: invoice.shipmentId,
          shipmentNumber: invoice.shipmentNumber,
          status: invoice.shipmentStatus,
          trackingNumber: invoice.trackingNumber,
          courierName: invoice.courierName,
          costs: {
            shipping: parseFloat(invoice.shippingCost || '0'),
            insurance: parseFloat(invoice.insuranceCost || '0'),
            handling: parseFloat(invoice.handlingFee || '0'),
            storage: parseFloat(invoice.storageFee || '0'),
          },
          declaredValue: parseFloat(invoice.declaredValue || '0'),
          declaredCurrency: invoice.declaredCurrency,
        } : null,
        // Shipping address (if applicable)
        shippingAddress,
      },
      lineItems: lineItemsQuery.map(item => ({
        id: item.id,
        description: item.description,
        quantity: parseFloat(item.quantity || '1'),
        unitPrice: parseFloat(item.unitPrice || '0'),
        lineTotal: parseFloat(item.lineTotal || '0'),
        taxRate: parseFloat(item.taxRate || '0'),
        taxAmount: parseFloat(item.taxAmount || '0'),
        referenceType: item.referenceType,
        referenceId: item.referenceId,
        sortOrder: item.sortOrder,
      })),
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching invoice details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice details' },
      { status: 500 }
    );
  }
}