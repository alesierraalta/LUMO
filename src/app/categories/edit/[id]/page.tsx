import { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryForm } from "@/components/categories/category-form";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Edit Category",
  description: "Edit product category",
};

async function getCategory(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    notFound();
  }

  return category;
}

export default async function EditCategoryPage({
  params,
}: {
  params: { id: string };
}) {
  const category = await getCategory(params.id);

  return (
    <div className="container mx-auto py-10">
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