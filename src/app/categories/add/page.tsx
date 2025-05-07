import { Metadata } from "next";
import { CategoryForm } from "@/components/categories/category-form";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const metadata: Metadata = {
  title: "Add Category",
  description: "Add a new product category",
};

export default function AddCategoryPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="mb-4">
        <Breadcrumb items={[
          { title: "Inventory", href: "/inventory" },
          { title: "Categories", href: "/categories" },
          { title: "Add" }
        ]} />
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Add Category</h1>
        <p className="text-sm text-muted-foreground">
          Create a new product category
        </p>
      </div>

      <div className="mx-auto max-w-2xl">
        <CategoryForm />
      </div>
    </div>
  );
} 