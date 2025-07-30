// app/api/admin/settings/couriers/route.ts
import { 
    getCouriers, 
    createCourier 
  } from '@/features/settings/db/queries';
  import type { CourierFilters, NewCourier } from '@/features/settings/types/settings.types';
  import { NextRequest, NextResponse } from 'next/server';
  import { requirePermission } from '@/lib/auth/admin';
  
  export async function GET(request: NextRequest) {
    try {
      await requirePermission('admin.manage');
  
      const searchParams = request.nextUrl.searchParams;
      
      const filters: CourierFilters = {
        search: searchParams.get('search') || undefined,
        isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '50'),
      };
  
      const result = await getCouriers(filters);
      return NextResponse.json(result);
  
    } catch (error) {
      console.error('Error fetching couriers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch couriers' },
        { status: 500 }
      );
    }
  }
  
  export async function POST(request: NextRequest) {
    try {
      await requirePermission('admin.manage');
  
      const body = await request.json();
      const data: NewCourier = {
        code: body.code,
        name: body.name,
        website: body.website,
        trackingUrlTemplate: body.trackingUrlTemplate,
        isActive: body.isActive ?? true,
        apiCredentials: body.apiCredentials,
        integrationSettings: body.integrationSettings ?? {},
      };
  
      const courier = await createCourier(data);
      return NextResponse.json({ data: courier }, { status: 201 });
  
    } catch (error: any) {
      console.error('Error creating courier:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create courier' },
        { status: 400 }
      );
    }
  }