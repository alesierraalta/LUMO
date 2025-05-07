import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
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

  return (
    <div className="container mx-auto py-10">
      <div className="mb-4">
        <Breadcrumb items={[
          { title: "Inventory", href: "/inventory" },
          { title: "Categories" }
        ]} />
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Manage your product categories here
          </p>
        </div>
        <Link href="/categories/add">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </Link>
      </div>

      <div className="mt-4 mb-6">
        <CategorySearch />
      </div>

      <CategoryList categories={categories} />
    </div>
  );
} 