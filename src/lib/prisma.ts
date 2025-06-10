/**
 * DATABASE CLIENT WRAPPER
 * 
 * This module provides unified database access that:
 * - Uses SQLite + Prisma for local development
 * - Uses Supabase for production (Choreo deployment)
 * - Automatically detects environment and switches accordingly
 * - Maintains backward compatibility with existing imports
 */

// Import the hybrid database client
import db from '@/lib/db';

// Re-export the hybrid client as prisma for backward compatibility
export const prisma = db;
export default db;
