import { Suspense } from 'react';
import Link from 'next/link';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">
                🔥 LUMO
              </h1>
              <span className="ml-3 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                Sistema de Inventario
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {new Date().toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ¡Bienvenido a LUMO! 🚀
            </h2>
            <p className="text-xl text-gray-600 mb-8">
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
          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">📦 Inventario</h3>
              <span className="text-2xl">📦</span>
            </div>
            <p className="text-gray-600 mb-4">Gestiona tu inventario de productos</p>
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
          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">🛍️ Productos</h3>
              <span className="text-2xl">🛍️</span>
            </div>
            <p className="text-gray-600 mb-4">Catálogo de productos disponibles</p>
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
          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">📊 Analytics</h3>
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-gray-600 mb-4">Reportes y análisis del sistema</p>
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
        </div>

        {/* API Endpoints Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔗 Enlaces de API Disponibles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">Monitoreo</h4>
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
              <h4 className="font-medium text-gray-700">Información del Sistema</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>🌐 Servidor: Next.js 15.3.1</p>
                <p>⚡ Estado: Operativo</p>
                <p>🔧 Versión: 1.0.0</p>
                <p>📅 Último deploy: {new Date().toLocaleDateString('es-ES')}</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <p className="text-gray-500 text-sm">
              © 2025 LUMO Inventory System. Sistema funcionando correctamente.
            </p>
            <div className="flex space-x-4">
              <Link href="/api/health" className="text-gray-400 hover:text-gray-600">
                Health Check
              </Link>
              <Link href="/api/urls" className="text-gray-400 hover:text-gray-600">
                API Docs
              </Link>
            </div>
          </div>
        </div>
      </footer>
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