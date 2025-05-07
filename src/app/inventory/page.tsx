import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle, Filter, Tags, Plus, Tag } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InventoryTable from "@/components/inventory/inventory-table";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Inventory",
  description: "Manage your inventory levels and products",
};

// Custom serialization function specifically for inventory data
// Avoids issues with the generic serializeDecimal function
function safeSerializeInventory(items: any[]) {
  return items.map(item => ({
    ...item,
    price: item.price ? Number(item.price) : 0,
    cost: item.cost ? Number(item.cost) : 0,
    margin: item.margin ? Number(item.margin) : 0
  }));
}

// Simple Categories Section Component
function CategoriesSection({ categories }: { categories: any[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Product Categories</CardTitle>
        <CardDescription>
          Manage and organize your product categories
        </CardDescription>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Tag className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Categories Found</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              You haven't created any product categories yet. Categories help you organize your inventory.
            </p>
            <Button asChild>
              <Link href="/categories/add">
                <Plus className="h-4 w-4 mr-2" />
                Create First Category
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(category => (
              <Card key={category.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                  <CardDescription className="line-clamp-1 text-xs">
                    {category.description || "No description"}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default async function InventoryPage() {
  try {
    // Use string-based query to avoid TypeScript errors with schema mismatches
    const inventoryItems = await prisma.$queryRaw`
      SELECT 
        i.id, i.name, i.description, i.sku, 
        i.price, i.cost, i.margin, 
        i.quantity, i."minStockLevel", 
        i.location, i."imageUrl", i.active, 
        i."categoryId"
      FROM inventory_items i 
      ORDER BY i."updatedAt" DESC
    ` as any[];

    // Fetch categories as a simple array
    const categories = await prisma.category.findMany() as any[];

    // Manual join to avoid serialization issues
    const itemsWithCategories = inventoryItems.map(item => {
      const category = item.categoryId 
        ? categories.find(c => c.id === item.categoryId) 
        : null;
      
      return {
        ...item,
        category
      };
    });
    
    // Filter the data for counts
    const lowStockCount = inventoryItems.filter(
      item => item.quantity <= item.minStockLevel && item.quantity > 0
    ).length;

    const outOfStockCount = inventoryItems.filter(
      item => item.quantity <= 0
    ).length;

    const activeItemsCount = inventoryItems.filter(
      item => item.active === true
    ).length;

    // Safe serialization
    const safeItems = safeSerializeInventory(itemsWithCategories);

    return (
      <div className="container mx-auto p-6">
        {/* Header with title and action buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Stock & Inventory</h1>
            <p className="text-muted-foreground">
              Manage your inventory levels, locations, and products
            </p>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Button asChild variant="outline">
              <Link href="/reports/low-stock">
                {lowStockCount > 0 && (
                  <Badge className="mr-2 bg-amber-500" aria-hidden="true">
                    {lowStockCount}
                  </Badge>
                )}
                Low Stock
              </Link>
            </Button>
            <Button asChild>
              <Link href="/inventory/add">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Item
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Stats cards row */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventoryItems.length} items</div>
              <p className="text-xs text-muted-foreground">
                {activeItemsCount} active
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-500">{lowStockCount} items</div>
              <p className="text-xs text-muted-foreground">
                Below minimum stock levels
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{outOfStockCount} items</div>
              <p className="text-xs text-muted-foreground">
                Items that need restocking
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="inventory" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="inventory">Stock Levels</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>
          
          <TabsContent value="inventory">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Inventory Status</CardTitle>
                <CardDescription>
                  Monitor stock levels, manage products, and view inventory details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InventoryTable inventoryItems={safeItems} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="categories">
            <CategoriesSection categories={categories} />
          </TabsContent>
        </Tabs>
      </div>
    );
  } catch (error) {
    console.error("Error loading inventory data:", error);
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold tracking-tight mb-4">Inventory</h1>
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Error Loading Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p>There was a problem loading the inventory data. Please try again later.</p>
            <p className="text-sm text-muted-foreground mt-2">{(error as Error).message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }
} 