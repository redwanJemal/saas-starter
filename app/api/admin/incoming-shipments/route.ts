// app/api/admin/incoming-shipments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/drizzle'
import { incomingShipments, couriers, warehouses } from '@/lib/db/schema'
import { desc, eq, sql } from 'drizzle-orm'
import { requirePermission } from '@/lib/auth/admin'

// Generate batch reference number
function generateBatchReference(): string {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const timestamp = now.getTime().toString().slice(-6)
  
  return `BATCH-${year}${month}${day}-${timestamp}`
}

// Get incoming shipments
export async function GET(request: NextRequest) {
  try {
    // Check permission
    await requirePermission('packages.read')

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const search = searchParams.get('search') || ''
    const offset = (page - 1) * limit

    // Build where conditions
    let whereConditions = []

    if (status) {
      whereConditions.push(eq(incomingShipments.status, status as any))
    }

    if (search) {
      whereConditions.push(
        sql`${incomingShipments.batchReference} ILIKE ${`%${search}%`}`
      )
    }

    // Combine conditions
    const whereClause = whereConditions.length > 0 
      ? whereConditions.reduce((acc, condition) => sql`${acc} AND ${condition}`)
      : undefined

    // Get shipments with related data
    const shipmentsQuery = db
      .select({
        id: incomingShipments.id,
        batchReference: incomingShipments.batchReference,
        courierId: incomingShipments.courierId,
        courierName: couriers.name,
        arrivalDate: incomingShipments.arrivalDate,
        totalPiecesExpected: incomingShipments.totalPiecesExpected,
        manifestFileUrl: incomingShipments.manifestFileUrl,
        scanCompletedAt: incomingShipments.scanCompletedAt,
        status: incomingShipments.status,
        createdAt: incomingShipments.createdAt,
        updatedAt: incomingShipments.updatedAt,
        warehouseName: warehouses.name,
        warehouseCode: warehouses.code,
      })
      .from(incomingShipments)
      .leftJoin(couriers, eq(incomingShipments.courierId, couriers.id))
      .leftJoin(warehouses, eq(incomingShipments.warehouseId, warehouses.id))
      .orderBy(desc(incomingShipments.createdAt))
      .limit(limit)
      .offset(offset)

    if (whereClause) {
      shipmentsQuery.where(whereClause)
    }

    const shipments = await shipmentsQuery

    // Get total count
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(incomingShipments)

    if (whereClause) {
      countQuery.where(whereClause)
    }

    const [{ count }] = await countQuery

    return NextResponse.json({
      shipments,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching incoming shipments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch incoming shipments' },
      { status: 500 }
    )
  }
}

// Create new incoming shipment
export async function POST(request: NextRequest) {
  try {
    // Check permission
    const adminUser = await requirePermission('packages.create')

    const body = await request.json()
    const { 
      courierId, 
      arrivalDate, 
      totalPiecesExpected, 
      manifestFileUrl,
      warehouseId 
    } = body

    // Validate required fields
    if (!courierId || !arrivalDate || !totalPiecesExpected) {
      return NextResponse.json(
        { error: 'Courier ID, arrival date, and total pieces expected are required' },
        { status: 400 }
      )
    }

    // Verify courier exists
    const [courier] = await db
      .select({ id: couriers.id, name: couriers.name })
      .from(couriers)
      .where(eq(couriers.id, courierId))
      .limit(1)

    if (!courier) {
      return NextResponse.json(
        { error: 'Courier not found' },
        { status: 404 }
      )
    }

    // Get default warehouse if not specified
    let selectedWarehouseId = warehouseId
    if (!selectedWarehouseId) {
      const [defaultWarehouse] = await db
        .select({ id: warehouses.id })
        .from(warehouses)
        .where(eq(warehouses.status, 'active'))
        .limit(1)

      if (!defaultWarehouse) {
        return NextResponse.json(
          { error: 'No active warehouse found' },
          { status: 400 }
        )
      }
      selectedWarehouseId = defaultWarehouse.id
    }

    // Generate batch reference
    const batchReference = generateBatchReference()

    // Create incoming shipment
    const [newShipment] = await db
      .insert(incomingShipments)
      .values({
        tenantId: adminUser.tenantId, // From authenticated admin user
        warehouseId: selectedWarehouseId,
        batchReference,
        courierId,
        arrivalDate: new Date(arrivalDate).toISOString(),
        totalPiecesExpected: parseInt(totalPiecesExpected),
        manifestFileUrl,
        status: 'pending',
        createdBy: adminUser.id,
      })
      .returning()

    return NextResponse.json(newShipment, { status: 201 })
  } catch (error) {
    console.error('Error creating incoming shipment:', error)
    return NextResponse.json(
      { error: 'Failed to create incoming shipment' },
      { status: 500 }
    )
  }
}

// Update incoming shipment
export async function PATCH(request: NextRequest) {
  try {
    // Check permission
    const adminUser = await requirePermission('packages.manage')

    const body = await request.json()
    const { id, status, scanCompletedAt, manifestFileUrl } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Shipment ID is required' },
        { status: 400 }
      )
    }

    // Verify shipment exists
    const [existingShipment] = await db
      .select({ id: incomingShipments.id })
      .from(incomingShipments)
      .where(eq(incomingShipments.id, id))
      .limit(1)

    if (!existingShipment) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      )
    }

    // Build update object
    const updateData: any = {
      updatedAt: sql`now()`
    }

    if (status) {
      updateData.status = status
    }

    if (scanCompletedAt) {
      updateData.scanCompletedAt = new Date(scanCompletedAt)
    }

    if (manifestFileUrl !== undefined) {
      updateData.manifestFileUrl = manifestFileUrl
    }

    // Update shipment
    const [updatedShipment] = await db
      .update(incomingShipments)
      .set(updateData)
      .where(eq(incomingShipments.id, id))
      .returning()

    return NextResponse.json(updatedShipment)
  } catch (error) {
    console.error('Error updating incoming shipment:', error)
    return NextResponse.json(
      { error: 'Failed to update incoming shipment' },
      { status: 500 }
    )
  }
}