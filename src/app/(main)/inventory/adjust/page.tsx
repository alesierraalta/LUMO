import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth-server";
import { isAdmin } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import BulkAdjustForm from "./bulk-adjust-form";

export const metadata: Metadata = {
  title: "Ajuste de Inventario",
  description: "Ajustar cantidades de múltiples productos en el inventario a la vez",
};

async function getInventoryProducts() {
  try {
    const products = await db.inventoryItem.findMany({
      where: {
        active: true,
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

export default async function AdjustInventoryPage() {
  // Verificar permisos
  const user = await getCurrentUser();
  
  

  // Obtener productos disponibles
  const products = await getInventoryProducts();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ajuste de Inventario</h1>
        <p className="text-muted-foreground mt-1">
          Ajusta las cantidades de múltiples productos en el inventario a la vez
        </p>
      </div>
      
      <BulkAdjustForm products={products} userId={user?.id || ''} />
    </div>
  );
} 