import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-singleton';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    // Get query parameters for pagination and filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;
    
    // Fetch stock movements with inventory item details
    const { data: movements, error } = await supabase
      .from('stock_movements')
      .select(`
        id,
        inventory_item_id,
        movement_type,
        quantity,
        previous_stock,
        new_stock,
        notes,
        created_at,
        inventory_items (
          id,
          name,
          sku
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching stock movements:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch stock movements' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format
    const transformedMovements = movements?.map(movement => ({
      id: movement.id,
      inventoryItemId: movement.inventory_item_id,
      movementType: movement.movement_type,
      quantity: movement.quantity,
      previousStock: movement.previous_stock,
      newStock: movement.new_stock,
      notes: movement.notes,
      createdAt: movement.created_at,
      inventoryItem: {
        id: movement.inventory_items?.id,
        name: movement.inventory_items?.name,
        sku: movement.inventory_items?.sku
      }
    })) || [];

    return NextResponse.json({
      success: true,
      movements: transformedMovements,
      pagination: {
        page,
        limit,
        total: transformedMovements.length
      }
    });

  } catch (error) {
    console.error('Error in stock movements API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    
    const {
      inventoryItemId,
      movementType,
      quantity,
      previousStock,
      newStock,
      notes
    } = body;

    // Validate required fields
    if (!inventoryItemId || !movementType || !quantity || previousStock === undefined || newStock === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert new stock movement
    const { data: movement, error } = await supabase
      .from('stock_movements')
      .insert({
        inventory_item_id: inventoryItemId,
        movement_type: movementType,
        quantity,
        previous_stock: previousStock,
        new_stock: newStock,
        notes: notes || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating stock movement:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create stock movement' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      movement
    });

  } catch (error) {
    console.error('Error in stock movements POST API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}