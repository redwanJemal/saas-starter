// app/api/customer/incoming-items/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { incomingShipmentItems, incomingShipments, couriers } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { getUserWithProfile } from '@/lib/db/queries';

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

    // Get incoming shipment items assigned to this customer that haven't been processed into packages yet
    const incomingItems = await db
      .select({
        id: incomingShipmentItems.id,
        trackingNumber: incomingShipmentItems.trackingNumber,
        courierTrackingUrl: incomingShipmentItems.courierTrackingUrl,
        assignmentStatus: incomingShipmentItems.assignmentStatus,
        scannedAt: incomingShipmentItems.scannedAt,
        assignedAt: incomingShipmentItems.assignedAt,
        description: incomingShipmentItems.description,
        estimatedValue: incomingShipmentItems.estimatedValue,
        estimatedValueCurrency: incomingShipmentItems.estimatedValueCurrency,
        weightKg: incomingShipmentItems.weightKg,
        lengthCm: incomingShipmentItems.lengthCm,
        widthCm: incomingShipmentItems.widthCm,
        heightCm: incomingShipmentItems.heightCm,
        isFragile: incomingShipmentItems.isFragile,
        isHighValue: incomingShipmentItems.isHighValue,
        requiresInspection: incomingShipmentItems.requiresInspection,
        notes: incomingShipmentItems.notes,
        specialInstructions: incomingShipmentItems.specialInstructions,
        // Incoming shipment info
        batchReference: incomingShipments.batchReference,
        expectedArrivalDate: incomingShipments.expectedArrivalDate,
        actualArrivalDate: incomingShipments.actualArrivalDate,
        // Courier info
        courierName: couriers.name,
        courierWebsite: couriers.website, // Fixed: Changed from websiteUrl to website
      })
      .from(incomingShipmentItems)
      .leftJoin(incomingShipments, eq(incomingShipmentItems.incomingShipmentId, incomingShipments.id))
      .leftJoin(couriers, eq(incomingShipments.courierId, couriers.id))
      .where(
        and(
          eq(incomingShipmentItems.assignedCustomerProfileId, customerId),
          eq(incomingShipmentItems.assignmentStatus, 'assigned')
        )
      )
      .orderBy(desc(incomingShipmentItems.assignedAt));

    // Format the response data safely
    const formattedItems = (incomingItems || []).map(item => {
      // Safely handle each field with null/undefined checks
      const safeItem = item || {};
      const safeDate = (date: unknown) => {
        if (!date) return null;
        if (date instanceof Date) return date.toISOString();
        if (typeof date === 'string') return date;
        return null;
      };
      
      return {
        id: safeItem.id || '',
        trackingNumber: safeItem.trackingNumber || '',
        courierTrackingUrl: safeItem.courierTrackingUrl || '',
        assignmentStatus: safeItem.assignmentStatus || 'pending',
        scannedAt: safeDate(safeItem.scannedAt),
        assignedAt: safeDate(safeItem.assignedAt),
        description: safeItem.description || '',
        estimatedValue: safeItem.estimatedValue ? Number(safeItem.estimatedValue) : 0,
        estimatedValueCurrency: safeItem.estimatedValueCurrency || 'USD',
        weightKg: safeItem.weightKg ? Number(safeItem.weightKg) : 0,
        lengthCm: safeItem.lengthCm ? Number(safeItem.lengthCm) : 0,
        widthCm: safeItem.widthCm ? Number(safeItem.widthCm) : 0,
        heightCm: safeItem.heightCm ? Number(safeItem.heightCm) : 0,
        isFragile: Boolean(safeItem.isFragile),
        isHighValue: Boolean(safeItem.isHighValue),
        requiresInspection: Boolean(safeItem.requiresInspection),
        notes: safeItem.notes || '',
        specialInstructions: safeItem.specialInstructions || '',
        batchReference: safeItem.batchReference || '',
        expectedArrivalDate: safeDate(safeItem.expectedArrivalDate)?.split('T')[0] || '',
        actualArrivalDate: safeDate(safeItem.actualArrivalDate)?.split('T')[0] || '',
        courierName: safeItem.courierName || '',
        courierWebsite: safeItem.courierWebsite || '',
      };
    });

    // Return empty array if no items found
    if (!formattedItems || !Array.isArray(formattedItems)) {
      return NextResponse.json({
        items: [],
        total: 0,
      });
    }

    return NextResponse.json({
      items: formattedItems,
      total: formattedItems.length,
    });

  } catch (error) {
    console.error('Error fetching customer incoming items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch incoming items' },
      { status: 500 }
    );
  }
}