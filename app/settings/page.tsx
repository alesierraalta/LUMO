import { Suspense } from 'react';
import { Sidebar } from '@/components/sidebar';

// Loading component for Suspense fallback
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
      <span className="ml-2 text-gray-600">Cargando configuración...</span>
    </div>
  );
}

// Settings page component
export default function SettingsPage() {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <Suspense fallback={<LoadingSpinner />}>
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">⚙️ Configuración</h1>
              <p className="text-gray-600">Personaliza LUMO según tus necesidades empresariales</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Configuración del Sistema</h2>
              <p className="text-gray-600">
                Esta página incluirá todas las opciones de configuración de tu aplicación LUMO.
                La configuración se realizará a través de los componentes existentes.
              </p>
            </div>
          </div>
        </Suspense>
      </main>
    </div>
  );
} 