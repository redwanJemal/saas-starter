// app/api/admin/settings/countries/[id]/route.ts
import { RouteContext } from '@/lib/types/route';
import { 
  getCountryById, 
  updateCountry, 
  deleteCountry 
} from '@/features/settings/db/queries';
import type { UpdateCountryData } from '@/features/settings/types/settings.types';
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/admin';

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await requirePermission('admin.manage');
    
    const { id } = await context.params;
    const country = await getCountryById(id);

    if (!country) {
      return NextResponse.json(
        { error: 'Country not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: country });

  } catch (error) {
    console.error('Error fetching country:', error);
    return NextResponse.json(
      { error: 'Failed to fetch country' },
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
    
    const data: UpdateCountryData = {
      code: body.code,
      name: body.name,
      region: body.region,
      subregion: body.subregion,
      isActive: body.isActive,
      isShippingEnabled: body.isShippingEnabled,
      requiresPostalCode: body.requiresPostalCode,
      requiresStateProvince: body.requiresStateProvince,
      euMember: body.euMember,
      customsFormType: body.customsFormType,
      flagEmoji: body.flagEmoji,
      phonePrefix: body.phonePrefix,
    };

    const country = await updateCountry(id, data);

    if (!country) {
      return NextResponse.json(
        { error: 'Country not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: country });

  } catch (error: any) {
    console.error('Error updating country:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update country' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await requirePermission('admin.manage');
    
    const { id } = await context.params;
    const success = await deleteCountry(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Country not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error deleting country:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete country' },
      { status: 400 }
    );
  }
}