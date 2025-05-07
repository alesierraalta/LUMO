"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProductForm from "@/components/products/product-form";
import { createProduct } from "@/services/productService";

export default function AddProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  return (
    <div className="container max-w-5xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Agregar Nuevo Producto</h1>
      <ProductForm 
        categories={categories}
      />
    </div>
  );
} 