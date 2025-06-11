'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RootLoginPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleRootLogin = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      console.log('🔧 Iniciando login ROOT...');
      
      const response = await fetch('/api/auth/root-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'alesierraalta@gmail.com',
          password: 'admin123'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage('✅ Login ROOT exitoso! Redirigiendo...');
        // Esperar un momento para que se establezca la cookie
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error en login ROOT:', error);
      setMessage('❌ Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔑 Acceso ROOT
          </h1>
          <p className="text-gray-600">
            Login exclusivo para administrador en Choreo
          </p>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Credenciales ROOT:</h3>
          <p className="text-sm text-blue-800">
            <strong>Email:</strong> alesierraalta@gmail.com<br/>
            <strong>Password:</strong> admin123
          </p>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            message.includes('✅') 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <button
          onClick={handleRootLogin}
          disabled={loading}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
            loading
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verificando acceso...
            </span>
          ) : (
            '🚀 Login como ROOT'
          )}
        </button>

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h4 className="font-semibold text-yellow-900 mb-2">ℹ️ Información:</h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Este endpoint solo funciona en Choreo</li>
            <li>• Verificará/creará el usuario ROOT automáticamente</li>
            <li>• Establecerá la sesión de autenticación</li>
            <li>• Te redirigirá al dashboard con acceso completo</li>
          </ul>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => router.push('/login')}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            ← Volver al login normal
          </button>
        </div>
      </div>
    </div>
  );
} 