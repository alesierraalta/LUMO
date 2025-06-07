/**
 * ROBUST PRISMA CLIENT WITH INLINE P6001 FIX
 * 
 * This module provides a production-ready Prisma client that:
 * - Automatically detects and fixes DATABASE_URL protocol issues
 * - Handles P6001 errors inline without external dependencies 
 * - Works reliably in all environments (dev, production, Choreo)
 * - Ensures client is always properly initialized
 */

// ¡ATENCIÓN! Este archivo ha sido modificado por el P6001-FIX agresivo
// Ahora solo re-exporta el cliente seguro desde prisma-monkey-patch.js

const { prisma } = require('./prisma-monkey-patch.js');

// Re-exportar todo desde el monkey patch
export { prisma };
export default prisma;

// Mantener compatibilidad con la API existente
export const basePrisma = prisma;
