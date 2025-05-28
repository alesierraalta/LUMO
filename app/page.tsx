import { Suspense } from 'react';
import Link from 'next/link';
import { Sidebar, MobileNav } from '@/components/sidebar';
import { PageHeader } from '@/components/ui/page-header';

// Loading component for Suspense fallback
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-2 text-gray-600">Cargando...</span>
    </div>
  );
}

// Main dashboard component
function Dashboard() {
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
              title="Panel de Control"
              description="Gestiona tu inventario y productos desde el dashboard principal"
            />

            {/* Welcome Section */}
            <div className="bg-card rounded-lg shadow-sm p-8 mb-8 border">
              <div className="text-center">
                <h2 className="text-4xl font-bold text-foreground mb-4">
                  ¡Bienvenido a LUMO! 🚀
                </h2>
                <p className="text-xl text-muted-foreground mb-8">
                  Tu sistema de gestión de inventario está funcionando perfectamente
                </p>
                <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Sistema Operativo
                </div>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Inventory Card */}
              <div className="bg-card rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">📦 Inventario</h3>
                  <span className="text-2xl">📦</span>
                </div>
                <p className="text-muted-foreground mb-4">Gestiona tu inventario de productos</p>
                <Link
                  href="/inventory"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Ver Inventario
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {/* Products Card */}
              <div className="bg-card rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">🛍️ Productos</h3>
                  <span className="text-2xl">🛍️</span>
                </div>
                <p className="text-muted-foreground mb-4">Catálogo de productos disponibles</p>
                <Link
                  href="/products"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Ver Productos
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {/* Analytics Card */}
              <div className="bg-card rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">📊 Analytics</h3>
                  <span className="text-2xl">📊</span>
                </div>
                <p className="text-muted-foreground mb-4">Reportes y análisis del sistema</p>
                <Link
                  href="/analytics"
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  Ver Analytics
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {/* Settings Card */}
              <div className="bg-card rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">⚙️ Configuración</h3>
                  <span className="text-2xl">⚙️</span>
                </div>
                <p className="text-muted-foreground mb-4">Configuración del sistema</p>
                <Link
                  href="/settings"
                  className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Ver Configuración
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-card rounded-lg shadow-sm p-6 border">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">📦</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-muted-foreground truncate">
                        Total en Inventario
                      </dt>
                      <dd className="text-lg font-medium text-foreground">1,247 productos</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg shadow-sm p-6 border">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">💰</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-muted-foreground truncate">
                        Valor Total
                      </dt>
                      <dd className="text-lg font-medium text-foreground">$125,847</dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg shadow-sm p-6 border">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">⚠️</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-muted-foreground truncate">
                        Alertas de Stock
                      </dt>
                      <dd className="text-lg font-medium text-destructive">23 productos</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* API Endpoints Section */}
            <div className="bg-card rounded-lg shadow-sm p-6 border">
              <h3 className="text-lg font-semibold text-foreground mb-4">🔗 Enlaces de API Disponibles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Monitoreo</h4>
                  <ul className="space-y-1">
                    <li>
                      <Link href="/api/health" className="text-blue-600 hover:text-blue-800 text-sm">
                        /api/health - Estado del sistema
                      </Link>
                    </li>
                    <li>
                      <Link href="/api/test" className="text-blue-600 hover:text-blue-800 text-sm">
                        /api/test - Prueba de conectividad
                      </Link>
                    </li>
                    <li>
                      <Link href="/api/urls" className="text-blue-600 hover:text-blue-800 text-sm">
                        /api/urls - Directorio de URLs
                      </Link>
                    </li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Información del Sistema</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>🌐 Servidor: Next.js 15.3.1</p>
                    <p>⚡ Estado: Operativo</p>
                    <p>🔧 Versión: 1.0.0</p>
                    <p>📅 Último deploy: {new Date().toLocaleDateString('es-ES')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Main page component with Suspense wrapper
export default function HomePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Dashboard />
    </Suspense>
  );
} 