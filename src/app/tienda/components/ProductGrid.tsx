"use client"

import ProductCard from './ProductCard';
import { getProducts } from '@/services/productService';

interface ProductGridProps {
  searchParams?: {
    [key: string]: string | string[] | undefined;
  };
}

export default async function ProductGrid({ searchParams = {} }: ProductGridProps) {
  const { products, pagination } = await getProducts(searchParams);

  if (!products?.length) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No products found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
} 