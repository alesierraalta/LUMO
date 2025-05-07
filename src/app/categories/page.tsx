import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle, Tag, Filter } from "lucide-react";
import prisma from "@/lib/prisma";
import { CategoryList } from "@/components/categories/category-list";
import { CategorySearch } from "@/components/categories/category-search";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const metadata: Metadata = {
  title: "Categories",
  description: "Manage your product categories",
};

interface PageProps {
  searchParams: { q?: string };
}

async function getCategories(query?: string) {
  const categories = await prisma.category.findMany({
    where: query ? {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    } : undefined,
    include: {
      _count: {
        select: { inventory: true },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  return categories;
}

export default async function CategoriesPage({ searchParams }: PageProps) {
  // Asegurarse de que searchParams es un objeto y extraer q de manera segura
  const query = searchParams?.q || undefined;
  const categories = await getCategories(query);
  const totalProducts = categories.reduce((sum, category) => sum + category._count.inventory, 0);

  return (
    <div className="container mx-auto py-6">
      <div className="mb-4">
        <Breadcrumb items={[
          { title: "Inventory", href: "/inventory" },
          { title: "Categories" }
        ]} />
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Categories</h1>
          <div className="flex items-center mt-1 gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {categories.length} {categories.length === 1 ? 'category' : 'categories'} | {totalProducts} total products
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <CategorySearch />
          <Link href="/categories/add">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </Link>
        </div>
      </div>
      
      <hr className="my-4 border-t border-border" />

      {query && (
        <div className="bg-muted/40 px-4 py-2 rounded-lg mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Search results for: <span className="font-medium">{query}</span>
            </span>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/categories">Clear</Link>
          </Button>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Tag className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No categories found</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-md">
            {query 
              ? `No categories matching "${query}". Try a different search term or create a new category.` 
              : "You haven't created any product categories yet. Categories help you organize your inventory."}
          </p>
          <Button asChild>
            <Link href="/categories/add">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Your First Category
            </Link>
          </Button>
        </div>
      ) : (
        <CategoryList categories={categories} />
      )}
    </div>
  );
} 