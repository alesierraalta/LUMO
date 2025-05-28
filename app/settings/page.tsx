import { Suspense } from 'react';
import Link from 'next/link';

// Loading component for Suspense fallback
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
      <span className="ml-2 text-gray-600">Cargando configuración...</span>
    </div>
  );
}

// Settings component
function SettingsPanel() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">⚙️ Configuración</h1>
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
                href="/analytics"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                📊 Analytics
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
                  Configuración del Sistema
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Personaliza LUMO según tus necesidades empresariales
                </p>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  🔄 Restaurar Defaults
                </button>
                <button
                  type="button"
                  className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  💾 Guardar Cambios
                </button>
              </div>
            </div>
          </div>

          {/* Settings sections */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left sidebar - Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Categorías
                  </h3>
                  <nav className="space-y-2">
                    {[
                      { name: 'General', icon: '🏢', active: true },
                      { name: 'Usuarios', icon: '👥', active: false },
                      { name: 'Inventario', icon: '📦', active: false },
                      { name: 'Notificaciones', icon: '🔔', active: false },
                      { name: 'Integraciones', icon: '🔗', active: false },
                      { name: 'Seguridad', icon: '🔐', active: false },
                      { name: 'Backup', icon: '💾', active: false }
                    ].map((item, index) => (
                      <a
                        key={index}
                        href="#"
                        className={`${
                          item.active
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        } group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors`}
                      >
                        <span className="mr-3 text-lg">{item.icon}</span>
                        {item.name}
                      </a>
                    ))}
                  </nav>
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {/* General settings */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      🏢 Configuración General
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="company-name" className="block text-sm font-medium text-gray-700">
                          Nombre de la Empresa
                        </label>
                        <input
                          type="text"
                          name="company-name"
                          id="company-name"
                          defaultValue="LUMO Inventory System"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                          Zona Horaria
                        </label>
                        <select
                          id="timezone"
                          name="timezone"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                        >
                          <option>UTC-5 (Lima, Bogotá)</option>
                          <option>UTC-3 (Buenos Aires)</option>
                          <option>UTC (Londres)</option>
                          <option>UTC+1 (Madrid)</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                          Moneda
                        </label>
                        <select
                          id="currency"
                          name="currency"
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                        >
                          <option>USD - Dólar Americano</option>
                          <option>EUR - Euro</option>
                          <option>PEN - Sol Peruano</option>
                          <option>COP - Peso Colombiano</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notifications settings */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      🔔 Configuración de Notificaciones
                    </h3>
                    <div className="space-y-4">
                      {[
                        { name: 'Stock bajo', description: 'Alertas cuando el stock está por debajo del mínimo', enabled: true },
                        { name: 'Nuevos productos', description: 'Notificar cuando se agregan nuevos productos', enabled: false },
                        { name: 'Reportes diarios', description: 'Enviar resumen diario por email', enabled: true },
                        { name: 'Alertas de sistema', description: 'Notificaciones de mantenimiento y actualizaciones', enabled: true }
                      ].map((notification, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">{notification.name}</h4>
                            <p className="text-sm text-gray-500">{notification.description}</p>
                          </div>
                          <div className="ml-4">
                            <button
                              type="button"
                              className={`${
                                notification.enabled ? 'bg-green-600' : 'bg-gray-200'
                              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2`}
                            >
                              <span
                                className={`${
                                  notification.enabled ? 'translate-x-5' : 'translate-x-0'
                                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                              />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* System info */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      📊 Información del Sistema
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Versión</dt>
                        <dd className="mt-1 text-sm text-gray-900">LUMO v1.0.0</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Base de Datos</dt>
                        <dd className="mt-1 text-sm text-gray-900">SQLite 3</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Última actualización</dt>
                        <dd className="mt-1 text-sm text-gray-900">28 de Enero, 2025</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Estado</dt>
                        <dd className="mt-1 text-sm text-green-600">✅ Operativo</dd>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Development notice */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="text-center py-8">
                      <div className="text-6xl mb-4">🚧</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Configuración Avanzada en Desarrollo
                      </h3>
                      <p className="text-gray-500 mb-6">
                        Las opciones avanzadas de configuración están siendo implementadas.
                        Próximamente tendrás control total sobre el sistema.
                      </p>
                      
                      {/* Feature preview */}
                      <div className="max-w-md mx-auto bg-gray-50 rounded-lg p-6">
                        <h4 className="font-medium text-gray-900 mb-3">Funcionalidades Próximas:</h4>
                        <ul className="text-sm text-gray-600 space-y-2">
                          <li>✅ Gestión de usuarios y roles</li>
                          <li>✅ Configuración de API keys</li>
                          <li>✅ Integraciones externas</li>
                          <li>✅ Personalización de workflows</li>
                          <li>✅ Configuración de backup automático</li>
                          <li>✅ Logs y auditoría</li>
                        </ul>
                      </div>

                      <div className="mt-6">
                        <Link
                          href="/"
                          className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
                        >
                          ← Volver al Dashboard
                        </Link>
                      </div>
                    </div>
                  </div>
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

export default function SettingsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SettingsPanel />
    </Suspense>
  );
} 