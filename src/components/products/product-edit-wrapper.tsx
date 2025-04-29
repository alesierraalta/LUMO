"use client";

import React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type ProductEditWrapperProps = {
  children: React.ReactNode;
  productId: string;
};

export default function ProductEditWrapper({ children, productId }: ProductEditWrapperProps) {
  const router = useRouter();
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as any, {
        onSubmit: async (data: any) => {
          try {
            // If categoryId is "none", set it to null for the database
            if (data.categoryId === "none") {
              data.categoryId = undefined;
            }
            
            const response = await fetch(`/api/products/${productId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(data),
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Error al actualizar el producto');
            }
            
            toast.success('Producto actualizado exitosamente');
            router.push('/products');
            router.refresh();
          } catch (error: any) {
            toast.error(error.message || 'Error al actualizar el producto');
            throw error;
          }
        },
      });
    }
    return child;
  });

  return <>{childrenWithProps}</>;
} 