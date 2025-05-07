"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "@/app/categories/columns";
import type { Category } from "@/app/categories/columns";
import { Pencil, Trash, PackageOpen, Tag } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface CategoryListProps {
  categories: Category[];
}

export function CategoryList({ categories }: CategoryListProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const handleDelete = async (category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      const response = await fetch(`/api/categories/${categoryToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete category");
      }

      toast.success("Category deleted successfully");
      router.refresh();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    } finally {
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const enhancedColumns = columns.map(col => {
    if (col.id === 'actions') {
      return {
        ...col,
        cell: ({ row }) => {
          const category = row.original;
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/categories/edit/${category.id}`)}
              >
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                asChild
              >
                <Link href={`/products?category=${category.id}`}>
                  <PackageOpen className="h-4 w-4" />
                  <span className="sr-only">View Products</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(category)}
                className="text-red-600 hover:text-red-900"
              >
                <Trash className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </Button>
            </div>
          );
        },
      };
    }
    else if (col.accessorKey === '_count.inventory') {
      return {
        ...col,
        cell: ({ row }) => {
          const count = row.original._count.inventory;
          return (
            <Link 
              href={`/products?category=${row.original.id}`}
              className={count > 0 ? "hover:underline" : ""}
            >
              {count > 0 ? (
                <Badge variant="secondary" className="flex gap-1 items-center">
                  <PackageOpen className="h-3 w-3" />
                  {count} {count === 1 ? 'product' : 'products'}
                </Badge>
              ) : (
                <span className="text-muted-foreground">No products</span>
              )}
            </Link>
          );
        },
      };
    }
    else if (col.accessorKey === 'name') {
      return {
        ...col,
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{row.original.name}</span>
            </div>
          );
        },
      };
    }
    return col;
  });

  return (
    <>
      <DataTable columns={enhancedColumns} data={categories} />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category
              {categoryToDelete?.name && ` "${categoryToDelete.name}"`}
              {categoryToDelete?._count.inventory ? 
                ` and affect ${categoryToDelete._count.inventory} products` : 
                ''
              }.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 