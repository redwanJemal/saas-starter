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
        courierWebsite: couriers.websiteUrl,
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

    // Format the response data
    const formattedItems = incomingItems.map(item => ({
      id: item.id,
      trackingNumber: item.trackingNumber || '',
      courierTrackingUrl: item.courierTrackingUrl || '',
      assignmentStatus: item.assignmentStatus,
      scannedAt: item.scannedAt?.toISOString() || null,
      assignedAt: item.assignedAt?.toISOString() || null,
      description: item.description || '',
      estimatedValue: item.estimatedValue ? parseFloat(item.estimatedValue) : 0,
      estimatedValueCurrency: item.estimatedValueCurrency || 'USD',
      weightKg: item.weightKg ? parseFloat(item.weightKg) : 0,
      lengthCm: item.lengthCm ? parseFloat(item.lengthCm) : 0,
      widthCm: item.widthCm ? parseFloat(item.widthCm) : 0,
      heightCm: item.heightCm ? parseFloat(item.heightCm) : 0,
      isFragile: item.isFragile || false,
      isHighValue: item.isHighValue || false,
      requiresInspection: item.requiresInspection || false,
      notes: item.notes || '',
      specialInstructions: item.specialInstructions || '',
      batchReference: item.batchReference || '',
      expectedArrivalDate: item.expectedArrivalDate || '',
      actualArrivalDate: item.actualArrivalDate || '',
      courierName: item.courierName || '',
      courierWebsite: item.courierWebsite || '',
    }));

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