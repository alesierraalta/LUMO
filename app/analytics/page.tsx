import { Suspense } from 'react';
import Link from 'next/link';

// Loading component for Suspense fallback
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      <span className="ml-2 text-gray-600">Cargando analytics...</span>
    </div>
  );
}

// Analytics component
function AnalyticsDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">📊 Analytics & Reportes</h1>
            </div>
            <nav className="flex space-x-4">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                🏠 Dashboard
              </Link>
              <Link
                href="/inventory"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                📦 Inventario
              </Link>
              <Link
                href="/products"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                🛍️ Productos
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page header */}
          <div className="mb-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                  Centro de Analytics
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Análisis detallado de inventario, ventas y tendencias
                </p>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  📅 Período
                </button>
                <button
                  type="button"
                  className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  📈 Generar Reporte
                </button>
              </div>
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">💰</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Valor Total Inventario
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">$125,847</dd>
                      <dd className="text-sm text-green-600">+5.2% vs mes anterior</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">📈</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Rotación Promedio
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">23.4 días</dd>
                      <dd className="text-sm text-green-600">-2.1 días vs mes anterior</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">⚠️</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Productos en Riesgo
                      </dt>
                      <dd className="text-lg font-medium text-red-600">23</dd>
                      <dd className="text-sm text-red-600">Stock bajo crítico</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">🎯</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Eficiencia
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">87.3%</dd>
                      <dd className="text-sm text-green-600">+1.2% vs mes anterior</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts section */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
            {/* Trends chart */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  📈 Tendencias de Inventario
                </h3>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📊</div>
                    <p className="text-gray-500">Gráfico de tendencias</p>
                    <p className="text-sm text-gray-400">Próximamente</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Category distribution */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  🥧 Distribución por Categoría
                </h3>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🥧</div>
                    <p className="text-gray-500">Gráfico circular</p>
                    <p className="text-sm text-gray-400">Próximamente</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top performers */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
            {/* Best sellers */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  🏆 Productos Top
                </h3>
                <div className="space-y-3">
                  {[
                    { name: 'Laptop Gaming XPro', value: '$12,450', trend: '+15%' },
                    { name: 'Smartphone Elite', value: '$8,200', trend: '+8%' },
                    { name: 'Auriculares Pro', value: '$5,600', trend: '+12%' },
                    { name: 'Monitor 4K Ultra', value: '$4,800', trend: '+6%' },
                    { name: 'Teclado Mecánico', value: '$3,200', trend: '+9%' }
                  ].map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">Valor total</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{item.value}</p>
                        <p className="text-sm text-green-600">{item.trend}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Alerts */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  🚨 Alertas y Notificaciones
                </h3>
                <div className="space-y-3">
                  {[
                    { type: 'error', message: '23 productos con stock bajo crítico', time: '2 min' },
                    { type: 'warning', message: '5 productos sin movimiento en 30 días', time: '1 hora' },
                    { type: 'info', message: 'Reporte mensual generado', time: '2 horas' },
                    { type: 'success', message: 'Importación de datos completada', time: '4 horas' }
                  ].map((alert, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                      <div className="flex-shrink-0">
                        {alert.type === 'error' && <span className="text-red-500">🔴</span>}
                        {alert.type === 'warning' && <span className="text-yellow-500">🟡</span>}
                        {alert.type === 'info' && <span className="text-blue-500">🔵</span>}
                        {alert.type === 'success' && <span className="text-green-500">🟢</span>}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                        <p className="text-xs text-gray-500">hace {alert.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                🔍 Analytics Avanzado
              </h3>
              
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🚧</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Analytics en Desarrollo
                </h3>
                <p className="text-gray-500 mb-6">
                  El sistema de analytics avanzado está siendo implementado.
                  Próximamente tendrás acceso a reportes detallados y insights poderosos.
                </p>
                
                {/* Feature preview */}
                <div className="max-w-md mx-auto bg-gray-50 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-3">Funcionalidades Próximas:</h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>✅ Dashboards interactivos</li>
                    <li>✅ Predicciones de demanda</li>
                    <li>✅ Análisis de tendencias</li>
                    <li>✅ Reportes automatizados</li>
                    <li>✅ Alertas inteligentes</li>
                    <li>✅ Export a Excel/PDF</li>
                  </ul>
                </div>

                <div className="mt-6">
                  <Link
                    href="/"
                    className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                  >
                    ← Volver al Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              LUMO Inventory System © 2025
            </p>
            <div className="flex space-x-4 text-sm text-gray-500">
              <Link href="/api/health" className="hover:text-gray-900">
                Estado del Sistema
              </Link>
              <Link href="/api/urls" className="hover:text-gray-900">
                API Directory
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AnalyticsDashboard />
    </Suspense>
  );
} 