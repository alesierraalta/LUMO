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
    if (isNaN(date.getTime())) {
      console.error('Invalid date input:', input);
      return 'Fecha Inválida';
    }
    
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error, 'Input:', input);
    return 'Fecha Inválida';
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
