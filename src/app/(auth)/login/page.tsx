'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, Building2, Shield, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('[Login] Starting login process...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Important: Include cookies in the request
      });

      const data = await response.json();

      if (response.ok) {
        console.log('[Login] Login successful, redirecting...');
        console.log('[Login] Response data:', data);
        toast.success('¡Inicio de sesión exitoso!');
        
        // Use a longer delay and window.location.href for full page reload
        // This ensures the cookie is properly set before middleware checks
        setTimeout(() => {
          console.log('[Login] Redirecting to dashboard...');
          window.location.href = data.redirectUrl || '/dashboard';
        }, 1000); // Increased to 1 second
      } else {
        console.log('[Login] Login failed:', data.error);
        // Traducir mensajes de error comunes
        let errorMessage = data.error || 'Error al iniciar sesión';
        if (data.error === 'Invalid email or password') {
          errorMessage = 'Correo electrónico o contraseña incorrectos';
        } else if (data.error === 'Authentication failed') {
          errorMessage = 'Autenticación fallida';
        } else if (data.error === 'Account is disabled') {
          errorMessage = 'La cuenta está desactivada';
        } else if (data.error === 'Account is temporarily locked') {
          errorMessage = 'La cuenta está temporalmente bloqueada';
        }
        setError(errorMessage);
        setIsLoading(false); // Reset loading state on error
      }
    } catch (error) {
      console.error('[Login] Network error:', error);
      setError('Error de red. Por favor, inténtalo de nuevo.');
      setIsLoading(false); // Reset loading state on error
    }
    // Note: Don't reset isLoading on success to prevent form resubmission
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding/Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="max-w-md">
            <h1 className="text-4xl font-bold mb-6">Bienvenido a LUMO</h1>
            <p className="text-xl mb-8 text-blue-100">
              Plataforma potente de gestión de inventario e inteligencia empresarial
            </p>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Gestión de Inventario</h3>
                  <p className="text-blue-100 text-sm">Seguimiento y gestión de tu inventario en tiempo real</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Analítica y Reportes</h3>
                  <p className="text-blue-100 text-sm">Obtén información con analítica potente</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Seguro y Confiable</h3>
                  <p className="text-blue-100 text-sm">Seguridad y confiabilidad de nivel empresarial</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0">
            <CardHeader className="space-y-1 pb-8">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-blue-600 p-3 rounded-lg">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold text-center">Iniciar Sesión</CardTitle>
              <CardDescription className="text-center text-lg">
                ¡Bienvenido de nuevo! Por favor, inicia sesión en tu cuenta
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Ingresa tu correo electrónico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-12 text-base"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Ingresa tu contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-12 text-base pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col space-y-6 pt-2">
                <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    'Iniciar sesión'
                  )}
                </Button>
                
                <div className="text-center text-sm text-muted-foreground">
                  ¿No tienes una cuenta?{' '}
                  <Link href="/register" className="text-primary hover:underline font-medium">
                    Crear cuenta
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
} 