// app/api/customer/couriers/route.ts
import { getCouriers } from '@/features/settings/db/queries';
import type { CourierFilters } from '@/features/settings/types/settings.types';
import { NextRequest, NextResponse } from 'next/server';
import { getUserWithProfile } from '@/features/auth/db/queries';

export async function GET(request: NextRequest) {
  try {
    const userWithProfile = await getUserWithProfile();
    if (!userWithProfile?.profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    
    const filters: CourierFilters = {
      search: searchParams.get('search') || undefined,
      isActive: true, // Only show active couriers to customers
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
    };

    const result = await getCouriers(filters);
    
    // If no couriers found in database, return common defaults
    if (result.data.length === 0) {
      const defaultCouriers = [
        { 
          id: 'ups', 
          code: 'UPS', 
          name: 'United Parcel Service', 
          website: 'https://www.ups.com',
          trackingUrlTemplate: 'https://www.ups.com/track?tracknum={trackingNumber}',
          isActive: true 
        },
        { 
          id: 'fedex', 
          code: 'FEDEX', 
          name: 'FedEx', 
          website: 'https://www.fedex.com',
          trackingUrlTemplate: 'https://www.fedex.com/fedextrack/?tracknumbers={trackingNumber}',
          isActive: true 
        },
        { 
          id: 'dhl', 
          code: 'DHL', 
          name: 'DHL Express', 
          website: 'https://www.dhl.com',
          trackingUrlTemplate: 'https://www.dhl.com/track?tracking-id={trackingNumber}',
          isActive: true 
        },
        { 
          id: 'usps', 
          code: 'USPS', 
          name: 'US Postal Service', 
          website: 'https://www.usps.com',
          trackingUrlTemplate: 'https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1={trackingNumber}',
          isActive: true 
        },
        { 
          id: 'aramex', 
          code: 'ARAMEX', 
          name: 'Aramex', 
          website: 'https://www.aramex.com',
          trackingUrlTemplate: 'https://www.aramex.com/track/results?mode=0&ShipmentNumber={trackingNumber}',
          isActive: true 
        },
        { 
          id: 'emiratespost', 
          code: 'EPOST', 
          name: 'Emirates Post', 
          website: 'https://www.emiratespost.ae',
          trackingUrlTemplate: 'https://www.emiratespost.ae/track-and-trace/?trackingCode={trackingNumber}',
          isActive: true 
        },
      ];
      
      return NextResponse.json({
        data: defaultCouriers,
        pagination: {
          page: 1,
          limit: 50,
          total: defaultCouriers.length,
          pages: 1,
        },
        source: 'default'
      });
    }

    return NextResponse.json({
      ...result,
      source: 'database'
    });

  } catch (error) {
    console.error('Error fetching couriers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch couriers' },
      { status: 500 }
    );
  }
}