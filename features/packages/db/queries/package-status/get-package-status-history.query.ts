// features/packages/db/queries/package-status/get-package-status-history.query.ts

import { db } from '@/lib/db';
import { packageStatusHistory, users } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import type { PackageStatusHistory } from '@/features/packages/types/package.types';

interface PackageStatusHistoryWithUser {
  id: string;
  packageId: string;
  fromStatus: string | null;
  toStatus: string;
  changeReason?: string;
  notes?: string;
  changedBy?: string;
  createdAt: Date;
  changedByName?: string;
  changedByEmail?: string;
}

export async function getPackageStatusHistory(packageId: string): Promise<PackageStatusHistoryWithUser[]> {
  const statusHistory = await db
    .select({
      id: packageStatusHistory.id,
      packageId: packageStatusHistory.packageId,
      fromStatus: packageStatusHistory.fromStatus,
      toStatus: packageStatusHistory.toStatus,
      changeReason: packageStatusHistory.changeReason,
      notes: packageStatusHistory.notes,
      changedBy: packageStatusHistory.changedBy,
      createdAt: packageStatusHistory.createdAt,
      changedByName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
      changedByEmail: users.email,
    })
    .from(packageStatusHistory)
    .leftJoin(users, eq(packageStatusHistory.changedBy, users.id))
    .where(eq(packageStatusHistory.packageId, packageId))
    .orderBy(desc(packageStatusHistory.createdAt));

  return statusHistory.map(history => ({
    id: history.id,
    packageId: history.packageId,
    fromStatus: history.fromStatus,
    toStatus: history.toStatus,
    changeReason: history.changeReason || '',
    notes: history.notes || '',
    changedBy: history.changedBy,
    createdAt: history.createdAt,
    changedByName: history.changedByName || '',
    changedByEmail: history.changedByEmail || '',
  }));
}