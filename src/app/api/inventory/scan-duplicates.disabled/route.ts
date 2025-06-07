import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "@/lib/auth/auth-options";
import { checkPermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Check authentication and permissions
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user has permission to manage inventory
    const hasPermission = await checkPermission(session.user.id, "inventory:manage");
    if (!hasPermission) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Get all products with their inventory and category
    const allProducts = await prisma.inventoryItem.findMany({
      include: {
        category: true,
      },
    });

    // Group products by name
    const productsByName = allProducts.reduce((acc, product) => {
      // Use lowercase name for case-insensitive comparison
      const nameLower = product.name.toLowerCase();
      if (!acc[nameLower]) {
        acc[nameLower] = [];
      }
      acc[nameLower].push(product);
      return acc;
    }, {} as Record<string, any[]>);
    
    // Find groups with duplicates (same name, different IDs)
    const duplicateGroups = Object.entries(productsByName)
      .filter(([_, products]) => products.length > 1)
      .map(([name, products]) => {
        // Format products for the response
        const formattedProducts = products.map(product => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: Number(product.price),
          cost: Number(product.cost),
          quantity: product.inventory?.quantity || 0,
          categoryName: product.category?.name || 'Sin categoría',
          createdAt: product.createdAt.toISOString(),
        }));
        
        // Sort by date (oldest first) and then by stock (highest first)
        formattedProducts.sort((a, b) => {
          // First prioritize products with inventory
          if (a.quantity > 0 && b.quantity === 0) return -1;
          if (a.quantity === 0 && b.quantity > 0) return 1;
          
          // Then prioritize older products
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
        
        return {
          name: products[0].name, // Use the original name
          products: formattedProducts,
        };
      });

    return NextResponse.json({ 
      duplicates: duplicateGroups,
      count: duplicateGroups.length 
    });
  } catch (error) {
    console.error("Error scanning for duplicates:", error);
    return NextResponse.json({ error: "Failed to scan for duplicates" }, { status: 500 });
  } finally {
    // No es necesario desconectar cuando usamos la instancia global
  }
} 