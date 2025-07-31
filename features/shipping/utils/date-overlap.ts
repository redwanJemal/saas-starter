// features/shipping/utils/date-overlap.ts
import { and, eq, gte, lte, or, SQL } from 'drizzle-orm';

/**
 * Creates a SQL condition for checking date overlaps between records
 * 
 * @param startField - The field representing the start date
 * @param endField - The field representing the end date (can be null)
 * @param newStart - The new start date string
 * @param newEnd - The new end date string (optional)
 * @returns SQL condition for checking date overlaps
 */
export function createDateOverlapCondition<T extends SQL<unknown>>(
  startField: T,
  endField: T,
  newStart: string,
  newEnd?: string | null
): SQL<unknown> {
  // Ensure we're working with non-null values
  const start = startField as SQL<unknown>;
  const end = endField as SQL<unknown>;
  
  if (newEnd) {
    // New record has both start and end dates
    return or(
      // Existing record has no end date and starts before new record ends
      and(
        eq(end, null),
        lte(start, newEnd)
      ) as SQL<unknown>,
      // Existing record overlaps with new record's date range
      and(
        gte(end, newStart),
        lte(start, newEnd)
      ) as SQL<unknown>
    ) as SQL<unknown>;
  }
  
  // New record has no end date (open-ended)
  return or(
    // Existing record has no end date
    eq(end, null),
    // Existing record ends after new record starts
    gte(end, newStart)
  ) as SQL<unknown>;
}
