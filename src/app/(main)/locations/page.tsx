import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import LocationsClient from "./client";
import { PageHeader } from "@/components/ui/page-header";

export default async function LocationsPage() {
  const user = await getCurrentUser();
  console.log('🔍 LocationsPage: getCurrentUser result:', user ? 'USER_FOUND' : 'NULL');

  if (!user) {
    redirect("/login");
  }

  // Obtener todas las ubicaciones
  const locationsData = await db.location.findMany({
    orderBy: {
      name: "asc"
    },
    include: {
      _count: {
        select: {
          inventoryItems: true
        }
      }
    }
  });

  // Transformar los datos para que coincidan con el tipo Location del cliente
  const locations = locationsData.map(loc => ({
    id: loc.id,
    name: loc.name,
    description: loc.description, // description ya es string | null
    isActive: loc.isActive,
    createdAt: loc.createdAt.toISOString(), // Convertir Date a string
    updatedAt: loc.updatedAt.toISOString(), // Convertir Date a string
    _count: {
      inventory: loc._count.inventoryItems
    }
  }));

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader
        title="Gestión de Ubicaciones"
        description="Administra las ubicaciones de almacén para tus productos"
      />
      
      <Suspense fallback={<div>Cargando ubicaciones...</div>}>
        <LocationsClient initialLocations={locations} />
      </Suspense>
    </div>
  );
} 