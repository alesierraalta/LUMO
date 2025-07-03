"use client";

import { Suspense } from "react";
import MovementsClient from "./client";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export default function MovementsHistoryPage() {
    return (
      <div className="container mx-auto py-4 space-y-6">
        <Breadcrumb
          items={[
            { title: "Inventario", href: "/inventory" },
            { title: "Movimientos" }
          ]}
          includeHome={true}
        />
        
        <Card>
          <CardHeader>
            <CardTitle>Historial de Movimientos</CardTitle>
            <CardDescription>
              Registro histórico de todas las entradas, salidas y ajustes del inventario
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="text-center p-8">Cargando historial de movimientos...</div>}>
              <MovementsClient />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    );
} 