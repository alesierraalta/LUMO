import { Suspense } from 'react';
import { Sidebar } from '@/components/sidebar';

// Loading component for Suspense fallback
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      <span className="ml-2 text-gray-600">Cargando analytics...</span>
    </div>
  );
}

// Analytics page component
export default function AnalyticsPage() {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <Suspense fallback={<LoadingSpinner />}>
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">📊 Analytics & Reportes</h1>
              <p className="text-gray-600">Análisis detallado de inventario, ventas y tendencias</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Centro de Reportes</h2>
              <p className="text-gray-600">
                Esta sección utiliza tus componentes existentes de reportes. 
                La funcionalidad completa estará disponible una vez que se conecten los datos.
              </p>
            </div>
          </div>
        </Suspense>
      </main>
    </div>
  );
} 