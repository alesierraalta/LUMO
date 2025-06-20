/**
 * SERVER-SAFE DATABASE CLIENT
 * Safe for use in Server Actions, API routes, and server components
 * Uses server-only Supabase client without realtime functionality
 */

import { supabaseServer } from './supabase-server-only';

// Server-safe database operations interface
export const dbServer = {
  inventoryItem: {
    update: async (params: any) => {
      const updateData: any = {};
      
      // Map application fields to database fields
      if (params.data.minStockLevel !== undefined) {
        updateData.min_stock_level = params.data.minStockLevel;
      }
      if (params.data.location !== undefined) {
        updateData.location = params.data.location;
      }
      if (params.data.lastUpdated !== undefined) {
        updateData.last_updated = params.data.lastUpdated;
      }
      
      // Add updated timestamp
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabaseServer
        .from('inventory_items')
        .update(updateData)
        .eq('id', params.where.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Server database error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      // Convert response back to application format
      return {
        id: data.id,
        sku: data.sku,
        name: data.name,
        quantity: data.quantity,
        minStockLevel: data.min_stock_level,
        location: data.location,
        lastUpdated: new Date(data.last_updated),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    },

    findUnique: async (params: any) => {
      const { data, error } = await supabaseServer
        .from('inventory_items')
        .select('*')
        .eq('id', params.where.id)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        sku: data.sku,
        name: data.name,
        quantity: data.quantity,
        minStockLevel: data.min_stock_level,
        location: data.location,
        lastUpdated: new Date(data.last_updated),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    }
  },

  stockMovement: {
    create: async (params: any) => {
      const movementData = {
        inventory_item_id: params.data.inventoryItemId,
        type: params.data.type,
        quantity: params.data.quantity,
        reason: params.data.reason,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabaseServer
        .from('stock_movements')
        .insert(movementData)
        .select()
        .single();

      if (error) {
        console.error('❌ Server database error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        id: data.id,
        inventoryItemId: data.inventory_item_id,
        type: data.type,
        quantity: data.quantity,
        reason: data.reason,
        createdAt: new Date(data.created_at)
      };
    }
  }
};

// Export for Server Actions
export default dbServer; 