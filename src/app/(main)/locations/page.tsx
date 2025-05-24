import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import LocationsClient from "./client";
import { PageHeader } from "@/components/ui/page-header";

export default async function LocationsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Obtener todas las ubicaciones
  const locations = await prisma.location.findMany({
    orderBy: {
      name: "asc"
    },
    include: {
      _count: {
        select: {
          inventory: true
        }
      }
    }
  });

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