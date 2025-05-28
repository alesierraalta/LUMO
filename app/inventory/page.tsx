import { Suspense } from 'react';
import { Sidebar, MobileNav } from '@/components/sidebar';
import { PageHeader } from '@/components/ui/page-header';
import InventoryTable from '@/components/inventory/inventory-table';

// Sample data for demonstration
const sampleInventoryItems = [
  {
    id: "1",
    name: "Laptop Gaming XPro",
    description: "Laptop para gaming de alta gama",
    sku: "LAP-001",
    price: 2500,
    cost: 1800,
    margin: 28,
    categoryId: "cat-1",
    category: { id: "cat-1", name: "Electrónicos" },
    quantity: 15,
    minStockLevel: 5,
    lastUpdated: new Date().toISOString(),
    location: "Almacén A",
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "2", 
    name: "Smartphone Elite",
    description: "Smartphone de última generación",
    sku: "PHONE-002",
    price: 800,
    cost: 600,
    margin: 25,
    categoryId: "cat-1",
    category: { id: "cat-1", name: "Electrónicos" },
    quantity: 3,
    minStockLevel: 10,
    lastUpdated: new Date().toISOString(),
    location: "Almacén B",
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "3",
    name: "Auriculares Pro",
    description: "Auriculares profesionales",
    sku: "AUD-003", 
    price: 150,
    cost: 90,
    margin: 40,
    categoryId: "cat-2",
    category: { id: "cat-2", name: "Accesorios" },
    quantity: 0,
    minStockLevel: 20,
    lastUpdated: new Date().toISOString(),
    location: "Almacén A",
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const sampleCategories = [
  { id: "cat-1", name: "Electrónicos", _count: { inventory: 2 } },
  { id: "cat-2", name: "Accesorios", _count: { inventory: 1 } }
];

// Loading component for Suspense fallback
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-2 text-gray-600">Cargando inventario...</span>
    </div>
  );
}

// Inventory management component
function InventoryManagement() {
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
              title="Gestión de Inventario"
              description="Controla tu inventario, gestiona stock y realiza movimientos de productos"
            />
            
            {/* Quick stats */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
              <div className="bg-card overflow-hidden shadow rounded-lg border">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-2xl">📦</div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-muted-foreground truncate">
                          Total Productos
                        </dt>
                        <dd className="text-lg font-medium text-foreground">{sampleInventoryItems.length}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card overflow-hidden shadow rounded-lg border">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-2xl">⚠️</div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-muted-foreground truncate">
                          Stock Bajo
                        </dt>
                        <dd className="text-lg font-medium text-destructive">
                          {sampleInventoryItems.filter(item => item.quantity <= item.minStockLevel).length}
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
                      <div className="text-2xl">💰</div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-muted-foreground truncate">
                          Valor Total
                        </dt>
                        <dd className="text-lg font-medium text-foreground">
                          ${sampleInventoryItems.reduce((total, item) => total + (item.price * item.quantity), 0).toLocaleString()}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-card shadow overflow-hidden sm:rounded-lg border">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-foreground mb-4">
                  📋 Inventario de Productos
                </h3>
                
                <InventoryTable 
                  inventoryItems={sampleInventoryItems}
                  allCategories={sampleCategories}
                  activeTab="all"
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <InventoryManagement />
    </Suspense>
  );
} 