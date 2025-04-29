import Link from "next/link";
import { Plus, ArrowUpDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllInventoryItems } from "@/services/inventoryService";
import InventoryTable from "@/components/inventory/inventory-table";

export default async function InventoryPage() {
  // Obtener datos reales del inventario
  const inventoryItems = await getAllInventoryItems();

  return (
    <div className="container max-w-7xl mx-auto space-y-6 p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Inventario</h1>
          <p className="text-muted-foreground">Seguimiento y administración de niveles de stock</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/products">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Producto
            </Link>
          </Button>
          <Button asChild>
            <Link href="/inventory/stock-movement">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Registrar Movimiento
            </Link>
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Estado del Inventario</CardTitle>
          <CardDescription>
            Monitorea niveles de stock y puntos de reorden
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InventoryTable inventoryItems={inventoryItems} />
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <div className="flex gap-4">
            <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
              Inicio
            </Link>
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-primary">
              Dashboard
            </Link>
          </div>
          <Link href="/products" className="text-sm text-muted-foreground hover:text-primary">
            Ver Productos
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
} 