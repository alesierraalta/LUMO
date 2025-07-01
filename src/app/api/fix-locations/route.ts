import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db-supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Fixing location references...');

    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    // Get all inventory items with null location
    const itemsWithoutLocation = await db.inventoryItem.findMany({
      where: {
        OR: [
          { location: null },
          { location: '' }
        ]
      }
    });

    console.log(`Found ${itemsWithoutLocation.length} items without location`);

    // Update items to use default location
    const updatePromises = itemsWithoutLocation.map(item => 
      db.inventoryItem.update({
        where: { id: item.id },
        data: { location: 'General' }
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: `Fixed ${itemsWithoutLocation.length} items with missing locations`,
      updatedItems: itemsWithoutLocation.length
    });

  } catch (error) {
    console.error('Error fixing locations:', error);
    return NextResponse.json(
      { error: 'Failed to fix locations' },
      { status: 500 }
    );
  }
} 