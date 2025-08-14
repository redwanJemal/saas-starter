// app/api/admin/scan-tracking/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { incomingShipments, incomingShipmentItems, couriers } from '@/lib/db/schema';
import { eq, sql, and, or } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth/admin';

interface DuplicateValidationResult {
  isValid: boolean;
  existingItem?: {
    id: string;
    trackingNumber: string;
    courierName: string;
    scannedAt: string;
    batchReference?: string;
  };
}

async function validateTrackingNumber(
  trackingNumber: string, 
  courierName: string, 
  tenantId: string
): Promise<DuplicateValidationResult> {
  // Check for existing tracking number with same courier in tenant
  const [existingItem] = await db
    .select({
      id: incomingShipmentItems.id,
      trackingNumber: incomingShipmentItems.trackingNumber,
      courierName: incomingShipmentItems.courierName,
      scannedAt: incomingShipmentItems.scannedAt,
      batchReference: incomingShipments.batchReference,
    })
    .from(incomingShipmentItems)
    .leftJoin(incomingShipments, eq(incomingShipmentItems.incomingShipmentId, incomingShipments.id))
    .where(
      and(
        eq(incomingShipmentItems.trackingNumber, trackingNumber),
        eq(incomingShipmentItems.courierName, courierName),
        eq(incomingShipmentItems.tenantId, tenantId)
      )
    )
    .limit(1);

  if (existingItem) {
    return {
      isValid: false,
      existingItem: {
        id: existingItem.id,
        trackingNumber: existingItem.trackingNumber || '',
        courierName: existingItem.courierName || '',
        scannedAt: existingItem.scannedAt?.toISOString() || '',
        batchReference: existingItem.batchReference || '',
      },
    };
  }

  return { isValid: true };
}

export async function POST(request: NextRequest) {
  try {
    // Check permission
    const adminUser = await requirePermission('packages.create');
    const body = await request.json();
    const { incomingShipmentId, trackingNumbers } = body;

    // Validate required fields
    if (!incomingShipmentId || !trackingNumbers || !Array.isArray(trackingNumbers)) {
      return NextResponse.json(
        { error: 'Incoming shipment ID and tracking numbers array are required' },
        { status: 400 }
      );
    }

    // Verify incoming shipment exists and get courier info
    const [shipment] = await db
      .select({
        id: incomingShipments.id,
        courierId: incomingShipments.courierId,
        courierName: incomingShipments.courierName,
        trackingUrlTemplate: couriers.trackingUrlTemplate,
        tenantId: incomingShipments.tenantId,
        warehouseId: incomingShipments.warehouseId,
      })
      .from(incomingShipments)
      .leftJoin(couriers, eq(incomingShipments.courierId, couriers.id))
      .where(eq(incomingShipments.id, incomingShipmentId))
      .limit(1);

    if (!shipment) {
      return NextResponse.json(
        { error: 'Incoming shipment not found' },
        { status: 404 }
      );
    }

    // Validate tracking numbers for duplicates
    const validationResults = await Promise.all(
      trackingNumbers
        .filter((trackingNumber: string) => trackingNumber.trim())
        .map(async (trackingNumber: string) => {
          const validation = await validateTrackingNumber(
            trackingNumber.trim(),
            shipment.courierName || '',
            adminUser.tenantId
          );
          return {
            trackingNumber: trackingNumber.trim(),
            ...validation,
          };
        })
    );

    // Separate valid and duplicate items
    const validItems = validationResults.filter(result => result.isValid);
    const duplicateItems = validationResults.filter(result => !result.isValid);

    // If we have duplicates, return them for user review
    if (duplicateItems.length > 0) {
      return NextResponse.json({
        success: false,
        message: `Found ${duplicateItems.length} duplicate tracking number(s)`,
        scannedCount: validItems.length,
        duplicateCount: duplicateItems.length,
        duplicates: duplicateItems.map(item => ({
          trackingNumber: item.trackingNumber,
          existingItem: item.existingItem,
        })),
        validItems: validItems.map(item => item.trackingNumber),
      }, { status: 409 });
    }

    // All items are valid, proceed with bulk insert
    if (validItems.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No valid tracking numbers to process',
        scannedCount: 0,
        duplicateCount: duplicateItems.length,
        items: [],
      });
    }

    const itemsToInsert = validItems.map((item) => {
      const courierTrackingUrl = shipment.trackingUrlTemplate
        ? shipment.trackingUrlTemplate.replace('{trackingNumber}', item.trackingNumber)
        : null;

      return {
        tenantId: adminUser.tenantId,
        warehouseId: shipment.warehouseId,
        incomingShipmentId: shipment.id,
        trackingNumber: item.trackingNumber,
        courierName: shipment.courierName,
        courierTrackingUrl,
        scannedBy: adminUser.id,
        scannedAt: new Date(),
        assignmentStatus: 'unassigned' as const,
      };
    });

    // Bulk insert items
    const insertedItems = await db
      .insert(incomingShipmentItems)
      .values(itemsToInsert)
      .returning({
        id: incomingShipmentItems.id,
        trackingNumber: incomingShipmentItems.trackingNumber,
        courierTrackingUrl: incomingShipmentItems.courierTrackingUrl,
        scannedAt: incomingShipmentItems.scannedAt,
      });

    return NextResponse.json({
      success: true,
      message: `Successfully scanned ${insertedItems.length} tracking number(s)`,
      scannedCount: insertedItems.length,
      duplicateCount: duplicateItems.length,
      items: insertedItems,
    });

  } catch (error) {
    console.error('Error scanning tracking numbers:', error);
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('unique_tracking_courier')) {
      return NextResponse.json(
        { 
          error: 'Duplicate tracking number detected',
          message: 'This tracking number with the same courier already exists in the system'
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to scan tracking numbers' },
      { status: 500 }
    );
  }
}