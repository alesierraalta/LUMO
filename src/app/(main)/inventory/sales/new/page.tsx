import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth-server";
import { isAdmin } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import NewSaleForm from "./new-sale-form";

export const metadata: Metadata = {
  title: "Nueva Orden de Venta",
  description: "Crear una nueva orden de venta con múltiples productos",
};

async function getInventoryProducts() {
  try {
    const products = await prisma?.inventoryItem.findMany({
      where: {
        active: true,
        quantity: {
          gt: 0 // Solo productos con stock disponible
        }
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Serializar para manejar correctamente los decimales
    return products?.map(product => ({
      ...product,
      price: product.price ? Number(product.price) : 0,
      cost: product.cost ? Number(product.cost) : 0,
      margin: product.margin ? Number(product.margin) : 0
    })) || [];
  } catch (error) {
    console.error("Error al cargar productos del inventario:", error);
    return [];
  }
}

export default async function NewSalePage() {
  // Verificar permisos
  const user = await getCurrentUser();
  
  if (!user || !isAdmin(user)) {
    redirect("/inventory");
  }

  // Obtener productos disponibles
  const products = await getInventoryProducts();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nueva Orden de Venta</h1>
        <p className="text-muted-foreground mt-1">
          Crea una orden de venta con múltiples productos
        </p>
      </div>
      
      <NewSaleForm products={products} userId={user.id} />
    </div>
  );
} 