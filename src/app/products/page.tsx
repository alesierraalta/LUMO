import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import prisma from "@/lib/prisma";
import { ProductList } from "@/components/products/product-list";
import { ProductSearch } from "@/components/products/product-search";

export const metadata: Metadata = {
  title: "Products",
  description: "Manage your products",
};

interface PageProps {
  searchParams: { q?: string; category?: string };
}

async function getProducts(query?: string, categoryId?: string) {
  const products = await prisma.product.findMany({
    where: {
      AND: [
        query ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { sku: { contains: query, mode: 'insensitive' } },
          ],
        } : {},
        categoryId ? { categoryId } : {},
      ],
    },
    include: {
      category: true,
      inventory: {
        select: {
          quantity: true,
          minStockLevel: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  return products;
}

async function getCategories() {
  return prisma.category.findMany({
    orderBy: {
      name: 'asc',
    },
  });
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const [products, categories] = await Promise.all([
    getProducts(searchParams.q, searchParams.category),
    getCategories(),
  ]);

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage your products here
          </p>
        </div>
        <Link href="/products/add">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      <div className="mt-4 mb-6">
        <ProductSearch categories={categories} />
      </div>

      <ProductList products={products} />
    </div>
  );
} 