// app/api/admin/settings/couriers/[id]/route.ts
import { 
    getCourierById, 
    updateCourier, 
    deleteCourier 
  } from '@/features/settings/db/queries';
  import type { UpdateCourierData } from '@/features/settings/types/settings.types';
  import { NextRequest, NextResponse } from 'next/server';
  import { requirePermission } from '@/lib/auth/admin';
  import { RouteContext } from '@/lib/types/route';
  
  export async function GET(
    request: NextRequest,
    context: RouteContext
  ) {
    try {
      await requirePermission('admin.manage');
      
      const { id } = await context.params;
      const courier = await getCourierById(id);
  
      if (!courier) {
        return NextResponse.json(
          { error: 'Courier not found' },
          { status: 404 }
        );
      }
  
      return NextResponse.json({ data: courier });
  
    } catch (error) {
      console.error('Error fetching courier:', error);
      return NextResponse.json(
        { error: 'Failed to fetch courier' },
        { status: 500 }
      );
    }
  }
  
  export async function PATCH(
    request: NextRequest,
    context: RouteContext
  ) {
    try {
      await requirePermission('admin.manage');
      
      const { id } = await context.params;
      const body = await request.json();
      
      const data: UpdateCourierData = {
        code: body.code,
        name: body.name,
        website: body.website,
        trackingUrlTemplate: body.trackingUrlTemplate,
        isActive: body.isActive,
        apiCredentials: body.apiCredentials,
        integrationSettings: body.integrationSettings,
      };
  
      const courier = await updateCourier(id, data);
  
      if (!courier) {
        return NextResponse.json(
          { error: 'Courier not found' },
          { status: 404 }
        );
      }
  
      return NextResponse.json({ data: courier });
  
    } catch (error: any) {
      console.error('Error updating courier:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update courier' },
        { status: 400 }
      );
    }
  }