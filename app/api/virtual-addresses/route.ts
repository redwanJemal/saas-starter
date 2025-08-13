// app/api/virtual-addresses/route.ts

import { getCustomerVirtualAddresses, getUserWithProfile } from '@/lib/db/queries';

export async function GET() {
  try {
    const userWithProfile = await getUserWithProfile();
    
    if (!userWithProfile?.customerProfile) {
      return Response.json(null, { status: 401 });
    }

    const virtualAddresses = await getCustomerVirtualAddresses(userWithProfile.customerProfile.id);
    
    // Enhance virtual addresses with formatted address for copying
    const enhancedAddresses = virtualAddresses.map(address => ({
      ...address,
      formattedAddress: formatVirtualAddress(address),
      copyableAddress: generateCopyableAddress(address)
    }));

    return Response.json(enhancedAddresses);
  } catch (error) {
    console.error('Error fetching virtual addresses:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function formatVirtualAddress(assignment: any) {
  const warehouse = assignment.warehouse;
  const user = assignment.user;
  const customerProfile = assignment.customerProfile;
  
  return {
    recipientName: `${user.firstName} ${user.lastName} (${customerProfile.customerId})`,
    companyName: warehouse.companyName || warehouse.name,
    suiteNumber: `Suite ${assignment.suiteCode}`,
    addressLine1: warehouse.addressLine1,
    addressLine2: warehouse.addressLine2,
    city: warehouse.city,
    stateProvince: warehouse.stateProvince,
    postalCode: warehouse.postalCode,
    country: warehouse.country,
    phone: warehouse.phone
  };
}

function generateCopyableAddress(assignment: any) {
  const warehouse = assignment.warehouse;
  const user = assignment.user;
  const customerProfile = assignment.customerProfile;
  const formatted = formatVirtualAddress(assignment);
  
  // Generate a copyable text format that includes customer ID
  let addressText = `${formatted.recipientName}\n`;
  
  if (formatted.companyName) {
    addressText += `${formatted.companyName}\n`;
  }
  
  addressText += `${formatted.suiteNumber}\n`;
  addressText += `${formatted.addressLine1}\n`;
  
  if (formatted.addressLine2) {
    addressText += `${formatted.addressLine2}\n`;
  }
  
  addressText += `${formatted.city}`;
  
  if (formatted.stateProvince) {
    addressText += `, ${formatted.stateProvince}`;
  }
  
  addressText += ` ${formatted.postalCode}\n`;
  addressText += `${formatted.country}`;
  
  if (formatted.phone) {
    addressText += `\nPhone: ${formatted.phone}`;
  }
  
  return addressText;
}