import { Suspense } from "react";
import MovementsClient from "./client";
import { getAllStockMovements } from "@/services/inventoryService";
import { formatDate, formatCurrency, ensureValidDate } from "@/lib/utils";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, RotateCw, Clipboard } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const dynamic = "force-dynamic";

export default async function MovementsHistoryPage() {
  try {
    const { movements: movementsRaw, pagination } = await getAllStockMovements({ limit: 100 });
    
    // Process the movements to ensure valid dates - with null checking
    const movements = (movementsRaw || []).map((movement: any) => ({
      ...movement,
      date: ensureValidDate(movement.date)
    }));
    
    const getMovementTypeInfo = (type: string) => {
      switch (type) {
        case "STOCK_IN":
          return { 
            label: "Entrada", 
            icon: <ArrowUp className="h-4 w-4 text-green-600" />,
            variant: "outline",
            color: "text-green-600" 
          };
        case "STOCK_OUT":
          return { 
            label: "Salida", 
            icon: <ArrowDown className="h-4 w-4 text-red-600" />,
            variant: "outline",
            color: "text-red-600" 
          };
        case "ADJUSTMENT":
          return { 
            label: "Ajuste", 
            icon: <RotateCw className="h-4 w-4 text-amber-600" />,
            variant: "outline",
            color: "text-amber-600" 
          };
        case "INITIAL":
          return { 
            label: "Inicial", 
            icon: <Clipboard className="h-4 w-4 text-blue-600" />,
            variant: "outline",
            color: "text-blue-600" 
          };
        default:
          return { 
            label: type, 
            icon: null,
            variant: "outline",
            color: "" 
          };
      }
    };

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
  } catch (error) {
    console.error("Error loading movements page:", error);
    
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
              Error al cargar los movimientos de inventario
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center p-8">
              <div className="text-red-600 mb-4">
                ⚠️ Error al cargar los datos
              </div>
              <p className="text-sm text-muted-foreground">
                Inténtalo de nuevo más tarde o contacta al administrador.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
} 