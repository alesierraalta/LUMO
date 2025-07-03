"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle, Tag, Filter } from "lucide-react";
import { CategoryList } from "@/components/categories/category-list";
import { CategorySearch } from "@/components/categories/category-search";
import { Breadcrumb } from "@/components/ui/breadcrumb";

interface Category {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  _count: {
    inventoryItems: number;
  };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for Vercel deployment
    const mockCategories: Category[] = [
      {
        id: "1",
        name: "Electronics",
        description: "Electronic devices and components",
        createdAt: new Date(),
        _count: { inventoryItems: 15 }
      },
      {
        id: "2", 
        name: "Office Supplies",
        description: "Office and business supplies",
        createdAt: new Date(),
        _count: { inventoryItems: 8 }
      },
      {
        id: "3",
        name: "Tools",
        description: "Hardware and hand tools",
        createdAt: new Date(),
        _count: { inventoryItems: 12 }
      }
    ];

    setCategories(mockCategories);
    setLoading(false);
  }, []);

  const totalProducts = categories.reduce((sum, category) => sum + category._count.inventoryItems, 0);

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading categories...</p>
          </div>
        </div>
      </div>
    );
  }

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

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Tag className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No categories found</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-md">
            You haven't created any product categories yet. Categories help you organize your inventory.
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