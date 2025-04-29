import Link from "next/link";
import { Plus, ArrowUpDown, PackageOpen, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllInventoryItems } from "@/services/inventoryService";
import InventoryTable from "@/components/inventory/inventory-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductsTable from "@/components/inventory/products-table";
import { getAllProducts } from "@/services/productService";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export default async function InventoryPage() {
  // Fetch both inventory and product data
  const [inventoryItems, products] = await Promise.all([
    getAllInventoryItems(),
    getAllProducts()
  ]);

  return (
    <div className="container max-w-7xl mx-auto space-y-6 p-6">
      <div className="flex flex-col gap-6">
        <Breadcrumb items={[{ title: "Inventory" }]} />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
            <p className="text-muted-foreground">Manage products and track stock levels</p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/inventory/add">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Link>
            </Button>
            <Button asChild>
              <Link href="/inventory/adjust">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Stock Movement
              </Link>
            </Button>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="inventory">Stock Levels</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inventory">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Inventory Status</CardTitle>
              <CardDescription>
                Monitor stock levels and reorder points
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
              <InventoryTable inventoryItems={inventoryItems} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="products">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Product Catalog</CardTitle>
              <CardDescription>
                Manage your product catalog and details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
              <ProductsTable products={products} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-between border-t pt-6">
        <div className="flex gap-4">
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
            Home
          </Link>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-primary">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
} 