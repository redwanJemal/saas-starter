// features/settings/db/queries/couriers/delete-courier.query.ts
import { db } from '@/lib/db';
import { couriers } from '@/features/settings/db/schema';
import { eq } from 'drizzle-orm';

export async function deleteCourier(id: string): Promise<boolean> {
    // Check if courier is used in tenant configurations, shipments, etc.
    // Add checks here as needed
  
    const result = await db
      .delete(couriers)
      .where(eq(couriers.id, id))
      .returning();
  
    return result.length > 0;
  }