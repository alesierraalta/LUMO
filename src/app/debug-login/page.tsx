'use client';

import { useState } from 'react';

export default function DebugLoginPage() {
  const [email, setEmail] = useState('alesierraalta@gmail.com');
  const [password, setPassword] = useState('admin123');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[Debug] Trying login with:', { email });
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      console.log('[Debug] Login response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }
      
      setResult(data);
    } catch (err: any) {
      console.error('[Debug] Login error:', err);
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const checkAdminUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin-setup?key=setup-admin-2025`);
      const data = await response.json();
      
      console.log('[Debug] Admin setup response:', data);
      setResult(data);
    } catch (err: any) {
      console.error('[Debug] Admin setup error:', err);
      setError(err.message || 'Error al verificar usuario admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-6 mt-10">
      <h1 className="text-2xl font-bold text-center">Debug Login</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          />
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Cargando...' : 'Probar Login'}
          </button>
          
          <button
            onClick={checkAdminUser}
            disabled={loading}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            Verificar Admin
          </button>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        {result && (
          <div className="mt-4">
            <h3 className="text-lg font-medium">Resultado:</h3>
            <pre className="bg-gray-100 p-3 rounded overflow-auto text-xs mt-2">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 