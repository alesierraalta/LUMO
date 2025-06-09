import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { isAdmin } from "@/lib/auth-simple";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
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
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { 
  ShoppingCart, 
  ArrowLeft, 
  Package, 
  User, 
  Calendar, 
  CircleCheck,
  CircleMinus,
  CircleX
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Detalle de Venta",
  description: "Información detallada de la orden de venta",
};

// Obtener los datos de la venta
async function getSaleDetails(id: string) {
  try {
    const sale = await prisma?.sale.findUnique({
      where: { id },
      include: {
        transactions: {
          include: {
            inventoryItem: {
              select: {
                id: true,
                name: true,
                sku: true,
                price: true,
                category: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!sale) return null;

    // Serializar los datos
    return {
      ...sale,
      total: Number(sale.total),
      subtotal: Number(sale.subtotal),
      tax: Number(sale.tax),
      transactions: sale.transactions.map(t => ({
        ...t,
        unitPrice: Number(t.unitPrice),
        subtotal: Number(t.subtotal)
      }))
    };
  } catch (error) {
    console.error("Error al obtener los detalles de la venta:", error);
    return null;
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

export default async function SaleDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  // Verificar permisos
  const user = await getCurrentUser();
  const isUserAdmin = user ? isAdmin(user) : false;

  if (!isUserAdmin) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-4">Acceso Denegado</h1>
        <p>No tienes permisos para acceder a esta página.</p>
      </div>
    );
  }

  // Obtener los detalles de la venta
  const sale = await getSaleDetails(params.id);

  // Si no se encuentra la venta, mostrar 404
  if (!sale) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              asChild
              className="rounded-full"
            >
              <Link href="/inventory">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Orden de Venta #{params.id.slice(-8)}</h1>
            {getSaleStatusBadge(sale.status)}
          </div>
          <p className="text-muted-foreground mt-1">
            Detalles de la venta realizada el {formatDateTime(sale.date)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            asChild
          >
            <Link href="/inventory/sales">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Ver Todas las Ventas
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Información general */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Detalles de la Venta</CardTitle>
            <CardDescription>
              Información general de la transacción
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Fecha y Hora</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(sale.date)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Procesado por</p>
                    <p className="text-sm text-muted-foreground">
                      {sale.user ? (
                        <>
                          {sale.user.firstName} {sale.user.lastName}
                          <span className="block">{sale.user.email}</span>
                        </>
                      ) : (
                        "Usuario del sistema"
                      )}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                {sale.notes && (
                  <div>
                    <p className="font-medium">Notas</p>
                    <p className="text-sm text-muted-foreground">{sale.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Resumen de la venta */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-primary/5 p-4 rounded-md">
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span className="text-xl font-bold">{formatCurrency(sale.total)}</span>
              </div>
            </div>
            
            <div>
              <p className="font-medium">Detalles</p>
              <ul className="text-sm space-y-1 mt-1">
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Productos:</span>
                  <span>{sale.transactions.length}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Unidades totales:</span>
                  <span>{sale.transactions.reduce((sum, t) => sum + t.quantity, 0)}</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Productos de la venta */}
      <Card>
        <CardHeader>
          <CardTitle>Productos Vendidos</CardTitle>
          <CardDescription>
            Detalle de los productos incluidos en esta venta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Precio Unitario</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sale.transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <div className="font-medium">
                      {transaction.inventoryItem?.name || "Producto desconocido"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      SKU: {transaction.inventoryItem?.sku || "N/A"}
                      {transaction.inventoryItem?.category && (
                        <> | Categoría: {transaction.inventoryItem.category.name}</>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{transaction.quantity}</TableCell>
                  <TableCell>{formatCurrency(transaction.unitPrice)}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(transaction.subtotal)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2">
                <TableCell colSpan={3} className="text-right font-bold">
                  Total:
                </TableCell>
                <TableCell className="font-bold text-lg">
                  {formatCurrency(sale.total)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 