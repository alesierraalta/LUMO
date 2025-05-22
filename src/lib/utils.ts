import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class names and resolves Tailwind CSS conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns the base URL for API requests
 * This is needed for server components where relative URLs won't work
 */
export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, ''); // Remove trailing slash if present
  }
  
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  return process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000' 
    : '';
}

/**
 * Validates and ensures a value is a proper Date object or null
 * This handles various date formats and empty objects that might come from the database
 */
export function ensureValidDate(dateInput: any): Date | null {
  // If it's already a Date object
  if (dateInput instanceof Date) {
    return dateInput;
  }
  
  // If it's null, undefined, or empty object
  if (dateInput === null || dateInput === undefined || 
      (typeof dateInput === 'object' && Object.keys(dateInput).length === 0)) {
    return null;
  }
  
  // If it's a string, try to parse it
  if (typeof dateInput === 'string') {
    try {
      const parsedDate = new Date(dateInput);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    } catch (error) {
      console.error("Failed to parse date string:", dateInput);
      return null;
    }
  }
  
  // For other cases, try to convert to date if possible
  try {
    const date = new Date(dateInput);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    console.error("Failed to convert to date:", dateInput);
    return null;
  }
}

/**
 * Formats a date value for display
 * Returns a fallback string if the date is invalid
 */
export function formatDate(dateInput: string | Date | null | undefined, fallback: string = "-"): string {
  const date = ensureValidDate(dateInput);
  
  if (!date) {
    return fallback;
  }
  
  try {
    return new Intl.DateTimeFormat('es-ES', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return fallback;
  }
}

/**
 * Formats a date value with time for display
 * Returns a fallback string if the date is invalid
 */
export function formatDateTime(dateInput: string | Date | null | undefined, fallback: string = "-"): string {
  const date = ensureValidDate(dateInput);
  
  if (!date) {
    return fallback;
  }
  
  try {
    return new Intl.DateTimeFormat('es-ES', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    console.error("Error formatting datetime:", error);
    return fallback;
  }
}

/**
 * Returns a new Date set to 00:00:00.000 of the given date
 */
export function startOfDay(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

/**
 * Returns a new Date set to 23:59:59.999 of the given date
 */
export function endOfDay(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
}

/**
 * Formats a number as currency (MXN)
 */
export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return "$0.00";
  }
  
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return "$0.00";
  }
  
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(numValue);
}

/**
 * Serializes Prisma Decimal objects to regular JavaScript numbers
 * This resolves the "Only plain objects can be passed to Client Components from Server Components"
 * error when passing Decimal values from Server Components to Client Components
 */
export function serializeDecimal<T>(data: T): T {
  // Return null/undefined as is
  if (data == null) {
    return data;
  }
  
  // Check if it's a Date object and convert to ISO string
  if (data instanceof Date) {
    return data.toISOString() as unknown as T;
  }
  
  // Check if it's a Decimal object (has toNumber method)
  if (typeof data === 'object' && 'toNumber' in data && typeof data.toNumber === 'function') {
    return data.toNumber() as unknown as T;
  }
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => serializeDecimal(item)) as unknown as T;
  }
  
  // Handle objects (recursively)
  if (typeof data === 'object') {
    const result: Record<string, any> = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = serializeDecimal((data as Record<string, any>)[key]);
      }
    }
    return result as unknown as T;
  }
  
  // Return primitives as is
  return data;
}

export function generatePagination(currentPage: number, totalPages: number) {
  // If total pages is 7 or less, show all pages
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // If current page is among the first 3 pages
  if (currentPage <= 3) {
    return [1, 2, 3, 4, '...', totalPages - 1, totalPages];
  }

  // If current page is among the last 3 pages
  if (currentPage >= totalPages - 2) {
    return [1, 2, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  // If current page is somewhere in the middle
  return [
    1,
    '...',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    '...',
    totalPages,
  ];
}

/**
 * Server-side function to calculate margin percentage 
 * Uses the formula (Price-Cost)/Cost to calculate profit margin as a percentage of cost
 */
export function calculateMargin(cost: number, price: number): number {
  // Ensure we're working with numbers
  cost = Number(cost) || 0;
  price = Number(price) || 0;
  
  // Handle edge cases
  if (cost <= 0) return 0; // Cannot calculate margin if cost is zero or negative
  if (price <= 0) return 0; // Cannot have a negative or zero price
  
  return ((price - cost) / cost) * 100;
}

/**
 * Server-side function to calculate price from cost and margin
 * Uses the formula Price = Cost*(1+Margin/100) to derive price from margin
 */
export function calculatePrice(cost: number, margin: number): number {
  // Ensure we're working with numbers
  cost = Number(cost) || 0;
  margin = Number(margin) || 0;
  
  // Handle edge cases
  if (cost <= 0) return 0;
  if (margin <= 0) return cost; // No margin means price equals cost
  
  return cost * (1 + margin / 100);
}

/**
 * Formats a number as a percentage
 * @param value The number to format as percentage
 * @param showSign Whether to add a sign (+ or -) for the percentage
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, showSign: boolean = false): string {
  const absValue = Math.abs(value);
  const sign = value > 0 && showSign ? '+' : '';
  
  return `${sign}${absValue.toFixed(2)}%`;
}
