"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CategoryForm } from "@/components/categories/category-form";
import { GitHubPagesDbService } from "@/lib/supabase-github-pages";
import { Breadcrumb } from "@/components/ui/breadcrumb";

interface ClientEditCategoryPageProps {
  categoryId: string;
}

export default function ClientEditCategoryPage({ categoryId }: ClientEditCategoryPageProps) {
  const router = useRouter();
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCategory = async () => {
      if (!categoryId) return;
      
      try {
        setLoading(true);
        const dbService = new GitHubPagesDbService();
        const categories = await dbService.getCategories();
        const foundCategory = categories.find(cat => cat.id === categoryId);
        
        if (!foundCategory) {
          setError("Category not found");
          return;
        }
        
        setCategory(foundCategory);
      } catch (error) {
        console.error('Error loading category:', error);
        setError("Failed to load category");
      } finally {
        setLoading(false);
      }
    };

    loadCategory();
  }, [categoryId]);

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading category...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-muted-foreground">{error || "Category not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-4">
        <Breadcrumb items={[
          { title: "Inventory", href: "/inventory" },
          { title: "Categories", href: "/categories" },
          { title: "Edit" }
        ]} />
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Edit Category</h1>
        <p className="text-sm text-muted-foreground">
          Update category information
        </p>
      </div>

      <div className="mx-auto max-w-2xl">
        <CategoryForm category={category} />
      </div>
    </div>
  );
} 