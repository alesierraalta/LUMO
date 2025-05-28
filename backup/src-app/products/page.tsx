import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import prisma from "@/lib/prisma";
import ProductList from "@/components/products/product-list";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { serializeDecimal } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Products",
  description: "Manage your products",
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getProducts(query?: string, categoryId?: string) {
  const products = await prisma.inventoryItem.findMany({
    where: {
      AND: [
        query ? {
          OR: [
            { name: { contains: query } },
            { description: { contains: query } },
            { sku: { contains: query } },
          ],
        } : {},
        categoryId ? { categoryId } : {},
      ],
    },
    include: {
      category: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  // Map the inventoryItem to match the expected product structure
  const mappedProducts = products.map(item => ({
    id: item.id,
    name: item.name,
    description: item.description,
    sku: item.sku,
    cost: item.cost,
    price: item.price,
    margin: item.margin,
    categoryId: item.categoryId,
    category: item.category,
    quantity: item.quantity,
    minStockLevel: item.minStockLevel,
    imageUrl: item.imageUrl,
    active: item.active,
  }));

  // Serializar los objetos Decimal a números JavaScript
  return serializeDecimal(mappedProducts);
}

async function getCategories() {
  return prisma.category.findMany({
    orderBy: {
      name: 'asc',
    },
  });
}

export default async function ProductsPage({ searchParams }: PageProps) {
  // Extract and handle searchParams safely - converted to string
  const resolvedSearchParams = await searchParams;
  const query = typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q : undefined;
  const categoryId = typeof resolvedSearchParams.category === 'string' ? resolvedSearchParams.category : undefined;

  const [products, categories] = await Promise.all([
    getProducts(query, categoryId),
    getCategories(),
  ]);

  // Find selected category if filtered by category
  const selectedCategory = categoryId ? 
    categories.find(cat => cat.id === categoryId) : null;

  return (
    <div className="container mx-auto py-10">
      <div className="mb-4">
        <Breadcrumb items={[
          { title: "Dashboard", href: "/dashboard" },
          { title: "Inventory", href: "/inventory" },
          { title: selectedCategory ? "Category" : "Products", href: selectedCategory ? `/categories` : undefined },
          ...(selectedCategory ? [{ title: selectedCategory.name }] : [])
        ]} />
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {selectedCategory ? `${selectedCategory.name} Products` : "Products"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {selectedCategory 
              ? `Viewing products in the ${selectedCategory.name} category`
              : "Manage your products here"
            }
          </p>
        </div>
        <Link href="/products/add">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      <ProductList products={products} categories={categories} />
    </div>
  );
} 