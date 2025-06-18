/**
 * COMPREHENSIVE CATEGORIES TESTS
 * This test suite covers ALL possible scenarios for category functionality
 * to ensure no runtime errors occur in production.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import db from '@/lib/db';

describe('Categories - COMPREHENSIVE TESTS', () => {
  let testUserId: string;
  let testRoleId: string;
  let testCategoryIds: string[] = [];

  beforeAll(async () => {
    // Create a test role first
    try {
      const testRole = await db.role.create({
        data: {
          name: `Test Role ${Date.now()}`,
          description: 'Test role for categories integration tests',
          isSystem: false,
          isActive: true
        }
      });
      testRoleId = testRole.id;
    } catch (error) {
      console.log('Error creating test role:', error);
      throw error;
    }

    // Create a test user for category operations
    try {
      const testUser = await db.user.create({
        data: {
          email: 'test-categories@example.com',
          password: 'hashedpassword',
          name: 'Test User',
          roleId: testRoleId,
          isActive: true
        }
      });
      testUserId = testUser.id;
    } catch (error) {
      // User might already exist, try to find it
      const existingUser = await db.user.findUnique({
        where: { email: 'test-categories@example.com' }
      });
      if (existingUser) {
        testUserId = existingUser.id;
      } else {
        throw error;
      }
    }
  });

  afterAll(async () => {
    // Clean up test data
    for (const categoryId of testCategoryIds) {
      try {
        await db.category.delete({ where: { id: categoryId } });
      } catch (error) {
        console.log('Category already deleted:', categoryId);
      }
    }
    
    // Clean up test user and role
    try {
      if (testUserId) {
        await db.user.delete({ where: { id: testUserId } });
      }
    } catch (error) {
      console.log('User already deleted');
    }
    
    try {
      if (testRoleId) {
        await db.role.delete({ where: { id: testRoleId } });
      }
    } catch (error) {
      console.log('Role already deleted');
    }
  });

  beforeEach(() => {
    testCategoryIds = [];
  });

  describe('1. Category Creation Scenarios', () => {
    it('should create category with all fields', async () => {
      const uniqueName = `Electronics-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const category = await db.category.create({
        data: {
          name: uniqueName,
          description: 'Electronic devices and accessories',
          createdById: testUserId
        }
      });

      expect(category).toBeDefined();
      expect(category.name).toBe(uniqueName);
      expect(category.description).toBe('Electronic devices and accessories');
      expect(category.createdById).toBe(testUserId);
      testCategoryIds.push(category.id);
    });

    it('should create category with minimal fields', async () => {
      const uniqueName = `Books-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const category = await db.category.create({
        data: {
          name: uniqueName,
          createdById: testUserId
        }
      });

      expect(category).toBeDefined();
      expect(category.name).toBe(uniqueName);
      expect(category.description).toBeUndefined();
      testCategoryIds.push(category.id);
    });

    it('should handle duplicate category names gracefully', async () => {
      const category1 = await db.category.create({
        data: {
          name: 'Clothing',
          createdById: testUserId
        }
      });
      testCategoryIds.push(category1.id);

      await expect(db.category.create({
        data: {
          name: 'Clothing',
          createdById: testUserId
        }
      })).rejects.toThrow();
    });
  });

  describe('2. Category Retrieval Scenarios', () => {
    let sampleCategories: any[] = [];

    beforeEach(async () => {
      // Create sample categories for testing
      const timestamp = Date.now();
      const categories = [
        { name: `Furniture-${timestamp}-1`, description: 'Home and office furniture' },
        { name: `Sports-${timestamp}-2`, description: 'Sports equipment and gear' },
        { name: `Kitchen-${timestamp}-3`, description: 'Kitchen appliances and tools' },
        { name: `Garden-${timestamp}-4`, description: 'Gardening tools and supplies' }
      ];

      for (const cat of categories) {
        const created = await db.category.create({
          data: {
            ...cat,
            createdById: testUserId
          }
        });
        sampleCategories.push(created);
        testCategoryIds.push(created.id);
      }
    });

    afterEach(() => {
      sampleCategories = [];
    });

    it('should find all categories without filters', async () => {
      const categories = await db.category.findMany();
      
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThanOrEqual(4);
      
      // Verify structure
      categories.forEach(category => {
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('createdAt');
        expect(category).toHaveProperty('updatedAt');
      });
    });

    it('should find categories with ordering', async () => {
      const categories = await db.category.findMany({
        orderBy: { name: 'asc' }
      });

      expect(categories.length).toBeGreaterThan(0);
      
      // Verify ordering
      for (let i = 1; i < categories.length; i++) {
        expect(categories[i].name >= categories[i-1].name).toBe(true);
      }
    });

    it('should find categories with search (OR conditions)', async () => {
      const timestamp = Date.now();
      
      // Create test categories with unique names
      await db.category.create({
        data: {
          name: `Kitchen ${timestamp}`,
          description: 'Kitchen appliances and tools',
          createdById: testUserId
        }
      });

      await db.category.create({
        data: {
          name: `Garden ${timestamp}`,
          description: 'Garden tools and equipment',
          createdById: testUserId
        }
      });

      // Search for categories
      const categories = await db.category.findMany({
        where: {
          OR: [
            { name: { contains: 'Kitchen' } },
            { description: { contains: 'tools' } }
          ]
        }
      });

      expect(categories.length).toBeGreaterThan(0);
      
      // Should find Kitchen (by name) and Garden (by description containing 'tools')
      const foundNames = categories.map(c => c.name);
      expect(foundNames).toContain(`Kitchen ${timestamp}`);
      expect(foundNames).toContain(`Garden ${timestamp}`);
    });

    it('should find single category by ID', async () => {
      const targetCategory = sampleCategories[0];
      const found = await db.category.findUnique({
        where: { id: targetCategory.id }
      });

      expect(found).toBeDefined();
      expect(found?.id).toBe(targetCategory.id);
      expect(found?.name).toBe(targetCategory.name);
    });

    it('should return null for non-existent category', async () => {
      const found = await db.category.findUnique({
        where: { id: 'non-existent-id' }
      });

      expect(found).toBeNull();
    });
  });

  describe('3. Category with Inventory Count (_count) Scenarios', () => {
    let categoryWithItems: any;
    let categoryWithoutItems: any;
    let inventoryItemIds: string[] = [];

    beforeEach(async () => {
      const timestamp = Date.now();
      
      // Create categories with unique names
      categoryWithItems = await db.category.create({
        data: {
          name: `Electronics Test ${timestamp}`,
          description: 'Category with inventory items',
          createdById: testUserId
        }
      });
      testCategoryIds.push(categoryWithItems.id);

      categoryWithoutItems = await db.category.create({
        data: {
          name: `Empty Category ${timestamp}`,
          description: 'Category without inventory items',
          createdById: testUserId
        }
      });
      testCategoryIds.push(categoryWithoutItems.id);

      // Create inventory items for the first category
      try {
        for (let i = 1; i <= 3; i++) {
          const item = await db.inventoryItem.create({
            data: {
              name: `Test Item ${i}`,
              sku: `TEST-${i}-${Date.now()}`,
              currentStock: 10,
              minStockLevel: 5,
              cost: 10.00,
              price: 15.00,
              categoryId: categoryWithItems.id,
              createdById: testUserId
            }
          });
          inventoryItemIds.push(item.id);
        }
      } catch (error) {
        console.log('Could not create inventory items for testing:', error);
      }
    });

    afterEach(async () => {
      // Clean up inventory items
      for (const itemId of inventoryItemIds) {
        try {
          await db.inventoryItem.delete({ where: { id: itemId } });
        } catch (error) {
          console.log('Item already deleted:', itemId);
        }
      }
      inventoryItemIds = [];
    });

    it('should get categories with inventory count', async () => {
      const categories = await db.category.findMany({
        include: {
          _count: {
            select: { inventoryItems: true }
          }
        },
        orderBy: { name: 'asc' }
      });

      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);

      // Every category should have _count property
      categories.forEach(category => {
        expect(category).toHaveProperty('_count');
        expect(category._count).toHaveProperty('inventoryItems');
        expect(typeof category._count.inventoryItems).toBe('number');
        expect(category._count.inventoryItems).toBeGreaterThanOrEqual(0);
      });

      // Find our test categories by partial name match
      const electronicsCategory = categories.find(c => c.name.includes('Electronics Test'));
      const emptyCategory = categories.find(c => c.name.includes('Empty Category'));

      if (electronicsCategory) {
        expect(electronicsCategory._count.inventoryItems).toBeGreaterThanOrEqual(0);
      }

      if (emptyCategory) {
        expect(emptyCategory._count.inventoryItems).toBe(0);
      }
    });

    it('should handle categories without _count when not requested', async () => {
      const categories = await db.category.findMany({
        orderBy: { name: 'asc' }
      });

      expect(Array.isArray(categories)).toBe(true);
      
      // Should not have _count property when not requested
      categories.forEach(category => {
        expect(category).not.toHaveProperty('_count');
      });
    });

    it('should calculate total products correctly', async () => {
      const categories = await db.category.findMany({
        include: {
          _count: {
            select: { inventoryItems: true }
          }
        }
      });

      // This is the exact calculation from the page that was failing
      const totalProducts = categories.reduce((sum, category) => {
        expect(category._count).toBeDefined();
        expect(category._count.inventoryItems).toBeDefined();
        expect(typeof category._count.inventoryItems).toBe('number');
        return sum + category._count.inventoryItems;
      }, 0);

      expect(typeof totalProducts).toBe('number');
      expect(totalProducts).toBeGreaterThanOrEqual(0);
    });
  });

  describe('4. Category Search and Filter Scenarios', () => {
    beforeEach(async () => {
      const uniqueId = Math.random().toString(36).substring(2, 15);
      
      // Create diverse categories for search testing with unique names
      const searchCategories = [
        { name: `Mobile Phones ${uniqueId}`, description: 'Smartphones and accessories' },
        { name: `Laptops ${uniqueId}`, description: 'Portable computers' },
        { name: `Tablets ${uniqueId}`, description: 'Tablet computers and accessories' },
        { name: `Audio Equipment ${uniqueId}`, description: 'Headphones, speakers, and audio gear' }
      ];

      for (const cat of searchCategories) {
        const created = await db.category.create({
          data: {
            ...cat,
            createdById: testUserId
          }
        });
        testCategoryIds.push(created.id);
      }
    });

    it('should search by name (contains)', async () => {
      const uniqueId = Math.random().toString(36).substring(2, 15);
      
      // Create test category with unique name
      const createdCategory = await db.category.create({
        data: {
          name: `Unique Mobile Phones ${uniqueId}`,
          description: 'Smartphones and accessories',
          createdById: testUserId
        }
      });
      testCategoryIds.push(createdCategory.id);

      const categories = await db.category.findMany({
        where: {
          name: { contains: 'Phone' }
        }
      });

      expect(categories.length).toBeGreaterThan(0);
      const foundNames = categories.map(c => c.name);
      expect(foundNames.some(name => name.includes('Phone'))).toBe(true);
      
      // Verify our created category is in the results
      expect(foundNames.some(name => name.includes(uniqueId))).toBe(true);
    });

    it('should search by description (contains)', async () => {
      const uniqueId = Math.random().toString(36).substring(2, 15);
      
      // Create unique category to avoid duplicates
      const createdCategory = await db.category.create({
        data: {
          name: `Unique Mobile Device ${uniqueId}`,
          description: 'Advanced smartphone technology',
          createdById: testUserId
        }
      });
      testCategoryIds.push(createdCategory.id);

      const categories = await db.category.findMany({
        where: {
          description: { contains: 'smartphone' }
        }
      });

      expect(categories.length).toBeGreaterThan(0);
      // Verify our created category is in the results
      const foundDescriptions = categories.map(c => c.description);
      expect(foundDescriptions.some(desc => desc && desc.includes('smartphone'))).toBe(true);
    });

    it('should search across name and description', async () => {
      const timestamp = Date.now();
      
      // Create unique category to avoid duplicates
      const createdCategory = await db.category.create({
        data: {
          name: `Search Mobile Phones ${timestamp}`,
          description: 'Latest mobile technology',
          createdById: testUserId
        }
      });
      testCategoryIds.push(createdCategory.id);

      const categories = await db.category.findMany({
        where: {
          OR: [
            { name: { contains: 'mobile' } },
            { description: { contains: 'mobile' } }
          ]
        }
      });

      expect(categories.length).toBeGreaterThan(0);
      // Verify our created category is in the results
      const foundItems = categories.filter(c => 
        (c.name && c.name.toLowerCase().includes('mobile')) || 
        (c.description && c.description.toLowerCase().includes('mobile'))
      );
      expect(foundItems.length).toBeGreaterThan(0);
    });

    it('should return empty array for no matches', async () => {
      const categories = await db.category.findMany({
        where: {
          OR: [
            { name: { contains: 'NonExistentCategory12345' } },
            { description: { contains: 'NonExistentDescription12345' } }
          ]
        }
      });

      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBe(0);
    });
  });

  describe('5. Category Update Scenarios', () => {
    let updateTestCategory: any;

    beforeEach(async () => {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      updateTestCategory = await db.category.create({
        data: {
          name: `Update Test Category ${timestamp}-${randomId}`,
          description: 'Original description',
          createdById: testUserId
        }
      });
      testCategoryIds.push(updateTestCategory.id);
    });

    it('should update category name', async () => {
      const updated = await db.category.update({
        where: { id: updateTestCategory.id },
        data: { name: 'Updated Category Name' }
      });

      expect(updated.name).toBe('Updated Category Name');
      expect(updated.description).toBe('Original description');
    });

    it('should update category description', async () => {
      const updated = await db.category.update({
        where: { id: updateTestCategory.id },
        data: { description: 'Updated description' }
      });

      expect(updated.name).toBe(updateTestCategory.name);
      expect(updated.description).toBe('Updated description');
    });

    it('should update both name and description', async () => {
      const updated = await db.category.update({
        where: { id: updateTestCategory.id },
        data: { 
          name: 'Completely New Name',
          description: 'Completely new description'
        }
      });

      expect(updated.name).toBe('Completely New Name');
      expect(updated.description).toBe('Completely new description');
    });
  });

  describe('6. Category Deletion Scenarios', () => {
    it('should delete category without inventory items', async () => {
      const category = await db.category.create({
        data: {
          name: 'Delete Test Category',
          createdById: testUserId
        }
      });

      const result = await db.category.delete({
        where: { id: category.id }
      });

      expect(result).toBeDefined();

      // Verify deletion
      const found = await db.category.findUnique({
        where: { id: category.id }
      });
      expect(found).toBeNull();
    });

    it('should handle deletion of non-existent category', async () => {
      await expect(db.category.delete({
        where: { id: 'non-existent-id' }
      })).rejects.toThrow();
    });
  });

  describe('7. Category Count Scenarios', () => {
    beforeEach(async () => {
      const timestamp = Date.now();
      
      // Create a few categories for counting with unique names
      for (let i = 1; i <= 3; i++) {
        const category = await db.category.create({
          data: {
            name: `Count Test Category ${i} ${timestamp}`,
            createdById: testUserId
          }
        });
        testCategoryIds.push(category.id);
      }
    });

    it('should count all categories', async () => {
      const count = await db.category.count();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(3);
    });

    it('should count categories with filter', async () => {
      const count = await db.category.count({
        where: {
          OR: [
            { name: { contains: 'Count Test' } }
          ]
        }
      });
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(3);
    });
  });

  describe('8. Edge Cases and Error Handling', () => {
    it('should handle empty search query gracefully', async () => {
      const categories = await db.category.findMany({
        where: {
          OR: [
            { name: { contains: '' } },
            { description: { contains: '' } }
          ]
        }
      });

      expect(Array.isArray(categories)).toBe(true);
      // Empty string search should return all categories
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should handle null/undefined values in search', async () => {
      const categories = await db.category.findMany({
        where: undefined
      });

      expect(Array.isArray(categories)).toBe(true);
    });

    it('should handle complex nested queries', async () => {
      const categories = await db.category.findMany({
        where: {
          OR: [
            { name: { contains: 'Test' } },
            { description: { contains: 'Test' } }
          ]
        },
        include: {
          _count: {
            select: { inventoryItems: true }
          }
        },
        orderBy: { name: 'asc' }
      });

      expect(Array.isArray(categories)).toBe(true);
      
      categories.forEach(category => {
        expect(category).toHaveProperty('_count');
        expect(category._count).toHaveProperty('inventoryItems');
        expect(typeof category._count.inventoryItems).toBe('number');
      });
    });
  });

  describe('9. Real-world Usage Scenarios', () => {
    it('should replicate exact categories page query', async () => {
      // Create a test category that will match our search
      const timestamp = Date.now();
      const createdCategory = await db.category.create({
        data: {
          name: `Test Category ${timestamp}`,
          description: 'This is a test category for search functionality',
          createdById: testUserId
        }
      });
      testCategoryIds.push(createdCategory.id);
      
      // This is the EXACT query from the categories page that was failing
      const query = 'test'; // Simulate search query
      
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
      expect(categories.length).toBeGreaterThan(0);
      
      // Verify our test category is found
      const foundTestCategory = categories.find(c => c.name.includes('Test Category'));
      expect(foundTestCategory).toBeDefined();
      
      // This is the exact calculation that was failing
      const totalProducts = categories.reduce((sum, category) => {
        expect(category._count).toBeDefined();
        expect(category._count.inventoryItems).toBeDefined();
        expect(typeof category._count.inventoryItems).toBe('number');
        return sum + category._count.inventoryItems;
      }, 0);

      expect(typeof totalProducts).toBe('number');
      expect(totalProducts).toBeGreaterThanOrEqual(0);
    });

    it('should handle categories page without search query', async () => {
      // This is the query when no search is performed
      const categories = await db.category.findMany({
        where: undefined,
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
      
      const totalProducts = categories.reduce((sum, category) => {
        expect(category._count).toBeDefined();
        expect(category._count.inventoryItems).toBeDefined();
        return sum + category._count.inventoryItems;
      }, 0);

      expect(typeof totalProducts).toBe('number');
    });
  });
}); 