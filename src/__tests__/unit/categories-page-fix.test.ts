/**
 * CRITICAL TEST: Categories Page Error Fix
 * This test replicates the exact scenario that was causing the runtime error
 */

import { describe, it, expect } from '@jest/globals';
import db from '@/lib/db';

describe('Categories Page Error Fix - CRITICAL', () => {
  it('should handle the exact categories page query without errors', async () => {
    // This is the EXACT query from the categories page that was failing
    const query = undefined; // No search query
    
    const categories = await db.category.findMany({
      where: query ? {
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
        ],
      } : undefined,
      include: {
        _count: {
          select: { inventoryItems: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Verify the structure is correct
    expect(Array.isArray(categories)).toBe(true);
    
    // This is the exact calculation that was failing with "Cannot read properties of undefined"
    const totalProducts = categories.reduce((sum, category) => {
      // These assertions ensure the structure is correct
      expect(category).toBeDefined();
      expect(category._count).toBeDefined();
      expect(category._count.inventoryItems).toBeDefined();
      expect(typeof category._count.inventoryItems).toBe('number');
      
      return sum + category._count.inventoryItems;
    }, 0);

    // Verify the calculation works
    expect(typeof totalProducts).toBe('number');
    expect(totalProducts).toBeGreaterThanOrEqual(0);
  });

  it('should handle categories page query WITH search', async () => {
    // This is the query when user searches
    const query = 'test';
    
    const categories = await db.category.findMany({
      where: query ? {
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
        ],
      } : undefined,
      include: {
        _count: {
          select: { inventoryItems: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    expect(Array.isArray(categories)).toBe(true);
    
    // The critical calculation that was failing
    const totalProducts = categories.reduce((sum, category) => {
      expect(category._count).toBeDefined();
      expect(category._count.inventoryItems).toBeDefined();
      return sum + category._count.inventoryItems;
    }, 0);

    expect(typeof totalProducts).toBe('number');
  });

  it('should handle empty categories array', async () => {
    // Test edge case of empty categories
    const categories: any[] = [];
    
    // This should not throw an error
    const totalProducts = categories.reduce((sum, category) => {
      return sum + category._count.inventoryItems;
    }, 0);

    expect(totalProducts).toBe(0);
  });

  it('should verify category structure matches expected format', async () => {
    const categories = await db.category.findMany({
      include: {
        _count: {
          select: { inventoryItems: true },
        },
      },
    });

    if (categories.length > 0) {
      const category = categories[0];
      
      // Verify all required properties exist
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('_count');
      expect(category._count).toHaveProperty('inventoryItems');
      
      // Verify types
      expect(typeof category.id).toBe('string');
      expect(typeof category.name).toBe('string');
      expect(typeof category._count.inventoryItems).toBe('number');
    }
  });
}); 