import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllProducts } from "@/services/productService";
import ProductList from "@/components/products/product-list";

export default async function ProductsPage() {
  // Fetch products on the server
  const products = await getAllProducts();

  return (
    <div className="container max-w-7xl mx-auto space-y-6 p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Link href="/products/add">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New Product
          </Button>
        </Link>
      </div>
      
      {/* Use the new ProductList component */}
      <ProductList products={products} />
    </div>
  );
} 