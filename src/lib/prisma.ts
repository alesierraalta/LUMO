// ¡ATENCIÓN! Este archivo ha sido modificado por el P6001-FIX agresivo
// Ahora solo re-exporta el cliente seguro desde prisma-monkey-patch.ts

import { prisma } from './prisma-monkey-patch';

// Re-exportar todo desde el monkey patch
export { prisma };
export default prisma;

// Mantener compatibilidad con la API existente
export const basePrisma = prisma;
