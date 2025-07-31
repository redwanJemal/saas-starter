import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatNumber = (weight: unknown, fixed?: number): string => {
  const num = Number(weight);
  return Number.isFinite(num) ? `${num.toFixed(fixed || 1)}` : 'N/A';
};