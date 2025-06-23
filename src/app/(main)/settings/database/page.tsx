import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth-server";
import { isAdmin } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DatabaseStatsClient from "./database-stats-client";

export const metadata: Metadata = {
  title: "Estadísticas de Base de Datos",
  description: "Monitoreo y optimización de la base de datos",
};

export default async function DatabaseStatsPage() {
  // Verificar permisos
  const user = await getCurrentUser();
  
  if (!user || !isAdmin(user)) {
    redirect("/");
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Estadísticas de Base de Datos</h1>
        <p className="text-muted-foreground">
          Monitoreo y optimización del rendimiento de la base de datos
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Estadísticas en Tiempo Real</CardTitle>
            <CardDescription>
              Monitoreo de consultas, caché y rendimiento del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DatabaseStatsClient />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 