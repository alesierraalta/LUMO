import { Suspense } from 'react';
import ProductList from '@/components/products/product-list';
import { Sidebar } from '@/components/sidebar';

// Loading component for Suspense fallback
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      <span className="ml-2 text-gray-600">Cargando productos...</span>
    </div>
  );
}

// Products page component that uses existing components
export default function ProductsPage() {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <Suspense fallback={<LoadingSpinner />}>
          <ProductList 
            products={[]} 
            categories={[]}
          />
        </Suspense>
      </main>
    </div>
  );
} 