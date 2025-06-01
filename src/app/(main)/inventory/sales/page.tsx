import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { ShoppingCart, Plus, ArrowRight, CircleCheck, CircleMinus, CircleX } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Historial de Ventas",
  description: "Visualiza todas las órdenes de venta realizadas",
};

// Obtener las ventas con paginación
async function getSales(page = 1, limit = 20) {
  try {
    const sales = await prisma?.sale.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        date: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        transactions: {
          select: {
            id: true,
            quantity: true
          }
        }
      }
    });

    const totalSales = await prisma?.sale.count();

    return {
      sales: sales?.map(sale => ({
        ...sale,
        total: Number(sale.total),
        subtotal: Number(sale.subtotal),
        tax: Number(sale.tax)
      })) || [],
      pagination: {
        total: totalSales || 0,
        page,
        limit,
        totalPages: Math.ceil((totalSales || 0) / limit)
      }
    };
  } catch (error) {
    console.error("Error al obtener las ventas:", error);
    return {
      sales: [],
      pagination: {
        total: 0,
        page,
        limit,
        totalPages: 0
      }
    };
  }
}

// Función para mostrar el estado de la venta
function getSaleStatusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
      return (
        <Badge className="bg-green-500 hover:bg-green-600">
          <CircleCheck className="h-3.5 w-3.5 mr-1" />
          Completada
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge className="bg-red-500 hover:bg-red-600">
          <CircleX className="h-3.5 w-3.5 mr-1" />
          Cancelada
        </Badge>
      );
    case "PENDING":
      return (
        <Badge className="bg-yellow-500 hover:bg-yellow-600">
          <CircleMinus className="h-3.5 w-3.5 mr-1" />
          Pendiente
        </Badge>
      );
    default:
      return (
        <Badge>
          {status}
        </Badge>
      );
  }
}

export default async function SalesPage({
  searchParams
}: {
  searchParams: { page?: string }
}) {
  // Verificar permisos
  const user = await getCurrentUser();
  const isUserAdmin = user ? isAdmin(user) : false;

  if (!isUserAdmin) {
    redirect("/inventory");
  }

  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const { sales, pagination } = await getSales(page);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Historial de Ventas</h1>
          <p className="text-muted-foreground mt-1">
            Registro histórico de todas las ventas realizadas
          </p>
        </div>
        <Button 
          asChild 
          className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all hover:shadow-md"
        >
          <Link href="/inventory/sales/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Orden de Venta
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Órdenes de Venta</CardTitle>
          <CardDescription>
            Todas las ventas realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sales.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">
                      {sale.id.slice(-8)}
                    </TableCell>
                    <TableCell>
                      {formatDateTime(sale.date)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(sale.total)}
                    </TableCell>
                    <TableCell>
                      {sale.transactions.length} productos
                      <div className="text-xs text-muted-foreground">
                        {sale.transactions.reduce((sum, t) => sum + t.quantity, 0)} unidades
                      </div>
                    </TableCell>
                    <TableCell>
                      {getSaleStatusBadge(sale.status)}
                    </TableCell>
                    <TableCell>
                      {sale.user ? (
                        <div className="text-sm">
                          <div className="font-medium">
                            {sale.user.firstName} {sale.user.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {sale.user.email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Sistema
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        asChild
                        className="h-8 px-2"
                      >
                        <Link href={`/inventory/sales/${sale.id}`}>
                          Ver Detalle
                          <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-16">
              <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No se encontraron ventas</h3>
              <p className="text-muted-foreground mt-1 mb-6 max-w-md mx-auto">
                No hay registros de ventas en el sistema. Crea tu primera orden de venta.
              </p>
              <Button asChild>
                <Link href="/inventory/sales/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Orden de Venta
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 