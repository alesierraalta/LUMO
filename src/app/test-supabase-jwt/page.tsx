'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { signInWithEmail, getSupabaseToken } from '@/lib/supabase-auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestSupabaseJWTPage() {
  const { user, loading, refetch, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email y password son requeridos');
      return;
    }

    setLoginLoading(true);
    setError(null);

    try {
      const result = await signInWithEmail(email, password);
      
      if (result.success) {
        console.log('✅ Login exitoso:', result.user);
        await refetch(); // Refresh user data
        
        // Get the JWT token
        const token = await getSupabaseToken();
        setCurrentToken(token);
      } else {
        setError(result.error || 'Error de login');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error('❌ Login error:', err);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const success = await logout();
      if (success) {
        console.log('✅ Logout exitoso');
        setCurrentToken(null);
      } else {
        setError('Error al hacer logout');
      }
    } catch (err) {
      setError('Error de logout');
      console.error('❌ Logout error:', err);
    }
  };

  const handleGetToken = async () => {
    try {
      const token = await getSupabaseToken();
      setCurrentToken(token);
      console.log('🔑 Current JWT Token:', token);
    } catch (err) {
      setError('Error obteniendo token');
      console.error('❌ Token error:', err);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Cargando...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔐 Test Supabase JWT Authentication</CardTitle>
          <CardDescription>
            Página de prueba para verificar la autenticación con JWT de Supabase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {user ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                <h3 className="font-semibold">✅ Usuario Autenticado</h3>
                <p><strong>ID:</strong> {user.id}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Nombre:</strong> {user.name || 'N/A'}</p>
                <p><strong>Rol:</strong> {user.role}</p>
                <p><strong>Activo:</strong> {user.isActive ? 'Sí' : 'No'}</p>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleLogout} variant="outline">
                  Logout
                </Button>
                <Button onClick={handleGetToken} variant="outline">
                  Obtener JWT Token
                </Button>
                <Button onClick={refetch} variant="outline">
                  Refrescar Usuario
                </Button>
              </div>

              {currentToken && (
                <div className="p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
                  <h4 className="font-semibold mb-2">🔑 JWT Token Actual:</h4>
                  <code className="text-xs break-all bg-white p-2 rounded block">
                    {currentToken}
                  </code>
                  <p className="text-xs mt-2">
                    <strong>Longitud:</strong> {currentToken.length} caracteres
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
                <h3 className="font-semibold">⚠️ No Autenticado</h3>
                <p>Por favor inicia sesión para probar el JWT de Supabase</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Email:</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Password:</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tu password"
                  />
                </div>

                <Button 
                  onClick={handleLogin} 
                  disabled={loginLoading}
                  className="w-full"
                >
                  {loginLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📋 Información del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || 'No configurada'}</p>
            <p><strong>Sistema de Auth:</strong> JWT Nativo de Supabase (Client/Server Separado)</p>
            <p><strong>Token de Desarrollo:</strong> lpjKTHcdpkmEB5j79a5V9zbH9wZ0s0akqcf8qw/sTKH6yahONHoc/K+vfZhXxksu2EIZSv4bZiv8N7DiV6Ib7g==</p>
            <p><strong>Estado del AuthContext:</strong> {loading ? 'Cargando' : 'Listo'}</p>
            <p><strong>Arquitectura:</strong> Client-side auth + Server-side verification</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 