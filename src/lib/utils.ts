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
 * Formats a date to a readable string
 */
export function formatDate(input: Date | string | null | undefined): string {
  if (!input) return 'N/A';
  
  try {
    // If it's already a Date object, use it directly
    let date: Date;
    
    if (input instanceof Date) {
      date = input;
    } else {
      // Try to parse the string date
      date = new Date(input);
    }
    
    // Validate the date
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
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
  
  // Check if it's a Decimal object (has toNumber method)
  if (typeof data === 'object' && 'toNumber' in data && typeof data.toNumber === 'function') {
    return data.toNumber() as unknown as T;
  }
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => serializeDecimal(item)) as unknown as T;
  }
  
  // Handle plain objects recursively
  if (typeof data === 'object' && data !== null) {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = serializeDecimal(value);
    }
    return result as T;
  }
  
  // Return primitive values as is
  return data;
}

export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '$0.00';
  
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
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
