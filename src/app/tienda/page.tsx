import { Suspense } from 'react';
import ProductGrid from './components/ProductGrid';
import ProductFilters from './components/ProductFilters';
import SearchBar from './components/SearchBar';
import SaleForm from './components/SaleForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Toaster } from '@/components/ui/toaster';

export const metadata = {
  title: 'Tienda | Inventory System',
  description: 'Browse and purchase products from our inventory',
};

export default async function StorePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Tienda</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sidebar with filters and sale form */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-4">Quick Sale</h2>
              <SaleForm />
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-4">Filters</h2>
              <ProductFilters />
            </div>
          </div>

          {/* Main content area */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <SearchBar />
            </div>

            <Suspense
              fallback={
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="border rounded-lg p-4">
                      <Skeleton className="h-48 w-full mb-4" />
                      <Skeleton className="h-4 w-2/3 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              }
            >
              <ProductGrid searchParams={searchParams} />
            </Suspense>
          </div>
        </div>
      </div>
      <Toaster />
    </>
  );
} 