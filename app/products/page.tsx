import { Suspense } from 'react';
import { Sidebar, MobileNav } from '@/components/sidebar';
import { PageHeader } from '@/components/ui/page-header';
import ProductList from '@/components/products/product-list';

// Sample product data for demonstration
const sampleProducts = [
  {
    id: "1",
    name: "Laptop Gaming XPro",
    description: "Laptop para gaming de alta gama con procesador Intel i9",
    sku: "LAP-001",
    price: 2500,
    cost: 1800,
    categoryId: "cat-1",
    category: { id: "cat-1", name: "Electrónicos" },
    barcode: "123456789012",
    active: true,
    imageUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // Additional fields for the component
    stockQuantity: 15,
    minStockLevel: 5
  },
  {
    id: "2",
    name: "Smartphone Elite",
    description: "Smartphone de última generación con cámara triple",
    sku: "PHONE-002", 
    price: 800,
    cost: 600,
    categoryId: "cat-1",
    category: { id: "cat-1", name: "Electrónicos" },
    barcode: "123456789013",
    active: true,
    imageUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stockQuantity: 3,
    minStockLevel: 10
  },
  {
    id: "3",
    name: "Auriculares Pro",
    description: "Auriculares profesionales con cancelación de ruido",
    sku: "AUD-003",
    price: 150,
    cost: 90,
    categoryId: "cat-2", 
    category: { id: "cat-2", name: "Accesorios" },
    barcode: "123456789014",
    active: true,
    imageUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stockQuantity: 0,
    minStockLevel: 20
  }
];

const sampleCategories = [
  { id: "cat-1", name: "Electrónicos", _count: { products: 2 } },
  { id: "cat-2", name: "Accesorios", _count: { products: 1 } }
];

// Loading component for Suspense fallback
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      <span className="ml-2 text-gray-600">Cargando productos...</span>
    </div>
  );
}

// Products catalog component
function ProductsCatalog() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile navigation */}
        <div className="md:hidden p-4 border-b">
          <MobileNav />
        </div>
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <PageHeader 
              title="Catálogo de Productos"
              description="Administra tu catálogo de productos, precios y categorías"
            />
            
            {/* Quick stats */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
              <div className="bg-card overflow-hidden shadow rounded-lg border">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-2xl">🛍️</div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-muted-foreground truncate">
                          Total Productos
                        </dt>
                        <dd className="text-lg font-medium text-foreground">{sampleProducts.length}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card overflow-hidden shadow rounded-lg border">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-2xl">📂</div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-muted-foreground truncate">
                          Categorías
                        </dt>
                        <dd className="text-lg font-medium text-foreground">{sampleCategories.length}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card overflow-hidden shadow rounded-lg border">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-2xl">✅</div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-muted-foreground truncate">
                          Activos
                        </dt>
                        <dd className="text-lg font-medium text-green-600">
                          {sampleProducts.filter(p => p.active).length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card overflow-hidden shadow rounded-lg border">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-2xl">⏸️</div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-muted-foreground truncate">
                          Inactivos
                        </dt>
                        <dd className="text-lg font-medium text-red-600">
                          {sampleProducts.filter(p => !p.active).length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Products List */}
            <div className="bg-card shadow overflow-hidden sm:rounded-lg border">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-foreground mb-4">
                  📋 Lista de Productos
                </h3>
                
                <ProductList 
                  products={sampleProducts}
                  categories={sampleCategories}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ProductsCatalog />
    </Suspense>
  );
} 