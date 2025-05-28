import { AlertCircle, Lock, UserX, Wifi } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface AccessDeniedProps {
  message: string;
  type?: 'permission' | 'auth' | 'database' | 'notfound';
  showRetry?: boolean;
  showContact?: boolean;
}

export function AccessDenied({ 
  message, 
  type = 'permission',
  showRetry = true,
  showContact = true 
}: AccessDeniedProps) {
  const getIcon = () => {
    switch (type) {
      case 'auth':
        return <UserX className="h-8 w-8 text-orange-500" />;
      case 'database':
        return <Wifi className="h-8 w-8 text-red-500" />;
      case 'notfound':
        return <UserX className="h-8 w-8 text-blue-500" />;
      default:
        return <Lock className="h-8 w-8 text-red-500" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'auth':
        return 'Inicio de sesión requerido';
      case 'database':
        return 'Error de sistema';
      case 'notfound':
        return 'Cuenta no configurada';
      default:
        return 'Acceso denegado';
    }
  };

  const getVariant = () => {
    switch (type) {
      case 'auth':
        return 'default' as const;
      case 'database':
        return 'destructive' as const;
      case 'notfound':
        return 'default' as const;
      default:
        return 'destructive' as const;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <CardTitle>{getTitle()}</CardTitle>
          <CardDescription>
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant={getVariant()}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>¿Qué puedes hacer?</AlertTitle>
            <AlertDescription>
              {type === 'auth' && "Inicia sesión con tu cuenta para continuar."}
              {type === 'database' && "Espera unos momentos e intenta nuevamente. Si el problema persiste, contacta al administrador."}
              {type === 'notfound' && "Contacta al administrador del sistema para que configure tu cuenta."}
              {type === 'permission' && "Solicita permisos adicionales al administrador del sistema."}
            </AlertDescription>
          </Alert>

          <div className="flex flex-col space-y-2">
            {type === 'auth' && (
              <Button asChild>
                <Link href="/sign-in">
                  Iniciar sesión
                </Link>
              </Button>
            )}

            {showRetry && type !== 'auth' && (
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
              >
                Intentar nuevamente
              </Button>
            )}

            {showContact && (
              <Button variant="outline" asChild>
                <Link href="/contact">
                  Contactar administrador
                </Link>
              </Button>
            )}

            <Button variant="ghost" asChild>
              <Link href="/">
                Volver al inicio
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 