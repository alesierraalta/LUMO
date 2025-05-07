import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle, Filter, Tags, Plus, Tag, Pencil, PackageOpen, BarChart3 } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InventoryTable from "@/components/inventory/inventory-table";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Inventario",
  description: "Gestiona tus niveles de inventario y productos",
};

// Función de serialización personalizada específicamente para datos de inventario
// Evita problemas con la función genérica serializeDecimal
function safeSerializeInventory(items: any[]) {
  return items.map(item => ({
    ...item,
    price: item.price ? Number(item.price) : 0,
    cost: item.cost ? Number(item.cost) : 0,
    margin: item.margin ? Number(item.margin) : 0
  }));
}

// Componente Sección de Categorías
function CategoriesSection({ categories }: { categories: any[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-primary/10">
            <Tag className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Categorías de Productos</h2>
          <Badge variant="outline" className="ml-2 font-medium">
            {categories.length}
          </Badge>
        </div>
        <Button asChild className="transition-all hover:shadow-md">
          <Link href="/categories/add">
            <Plus className="h-4 w-4 mr-2" />
            Añadir Categoría
          </Link>
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg border-2 border-dashed border-muted/60 transition-all">
          <div className="p-4 rounded-full bg-muted/20 mb-4">
            <Tag className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-medium mb-2">No Se Encontraron Categorías</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md px-6">
            Aún no has creado categorías de productos. Las categorías te ayudan a organizar tu inventario de manera eficiente.
          </p>
          <Button asChild size="lg" className="transition-all hover:shadow-md">
            <Link href="/categories/add">
              <Plus className="h-4 w-4 mr-2" />
              Crear Primera Categoría
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map(category => (
            <Card 
              key={category.id} 
              className="group overflow-hidden transition-all hover:shadow-lg border-muted/60 hover:border-primary/20 duration-300"
            >
              <CardHeader className="pb-2 bg-gradient-to-br from-card to-muted/5">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-primary/10 shrink-0">
                    <Tag className="h-4 w-4 text-primary" />
                  </div>
                  <span>{category.name}</span>
                </CardTitle>
                {category.description && (
                  <CardDescription className="line-clamp-2 text-sm mt-1">
                    {category.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="py-4">
                <div className="h-12">
                  {!category.description && <p className="text-muted-foreground text-sm">Sin descripción</p>}
                </div>
              </CardContent>
              <CardFooter className="border-t p-3 flex justify-between items-center bg-muted/5">
                <Badge variant="secondary" className="flex items-center gap-1 px-2.5 py-1">
                  <PackageOpen className="h-3 w-3" />
                  <span className="text-xs font-medium">{category._count?.inventory || 0} productos</span>
                </Badge>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" asChild className="h-8">
                    <Link href={`/categories/edit/${category.id}`}>
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Editar
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild className="h-8 transition-all hover:bg-primary hover:text-primary-foreground">
                    <Link href={`/categories`}>
                      Ver
                    </Link>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      <div className="flex justify-center mt-8">
        <Button variant="outline" size="lg" asChild className="transition-all hover:shadow-md hover:bg-primary/5 px-6">
          <Link href="/categories">
            Ver Todas las Categorías
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default async function InventoryPage() {
  try {
    // Usar consulta basada en string para evitar errores de TypeScript con discrepancias de esquema
    const inventoryItems = await prisma.$queryRaw`
      SELECT 
        i.id, i.name, i.description, i.sku, 
        i.price, i.cost, i.margin, 
        i.quantity, i."minStockLevel", 
        i.location, i."imageUrl", i.active, 
        i."categoryId"
      FROM inventory_items i 
      ORDER BY i."updatedAt" DESC
    ` as any[];

    // Obtener categorías con recuento de inventario
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { inventory: true }
        }
      }
    }) as any[];

    // Unión manual para evitar problemas de serialización
    const itemsWithCategories = inventoryItems.map(item => {
      const category = item.categoryId 
        ? categories.find(c => c.id === item.categoryId) 
        : null;
      
      return {
        ...item,
        category
      };
    });
    
    // Filtrar los datos para los conteos
    const lowStockCount = inventoryItems.filter(
      item => item.quantity <= item.minStockLevel && item.quantity > 0
    ).length;

    const outOfStockCount = inventoryItems.filter(
      item => item.quantity <= 0
    ).length;

    const activeItemsCount = inventoryItems.filter(
      item => item.active === true
    ).length;

    // Serialización segura
    const safeItems = safeSerializeInventory(itemsWithCategories);

    return (
      <div className="container mx-auto p-6 space-y-8">
        {/* Encabezado con título y botones de acción */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 bg-gradient-to-r from-background to-muted/20 p-5 rounded-lg shadow-sm border border-muted/30">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">Inventario y Existencias</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona tus niveles de inventario, ubicaciones y productos
            </p>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Button asChild variant="outline" className="transition-all hover:shadow-md border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/10">
              <Link href="/reports/low-stock">
                {lowStockCount > 0 && (
                  <Badge className="mr-2 bg-amber-500" aria-hidden="true">
                    {lowStockCount}
                  </Badge>
                )}
                Stock Bajo
              </Link>
            </Button>
            <Button asChild className="transition-all hover:shadow-md">
              <Link href="/inventory/add">
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Nuevo Artículo
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Fila de tarjetas de estadísticas */}
        <div className="grid gap-5 md:grid-cols-3 mb-8">
          <Card className="overflow-hidden transition-all hover:shadow-md border-muted/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-br from-card to-muted/5">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-primary/10">
                  <PackageOpen className="h-4 w-4 text-primary" />
                </div>
                Inventario Total
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">{inventoryItems.length}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                {activeItemsCount} artículos activos
              </p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden transition-all hover:shadow-md border-muted/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-br from-card to-muted/5">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-amber-500/10">
                  <BarChart3 className="h-4 w-4 text-amber-500" />
                </div>
                Artículos con Stock Bajo
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-amber-500">{lowStockCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Por debajo de niveles mínimos de stock
              </p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden transition-all hover:shadow-md border-muted/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-br from-card to-muted/5">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-red-500/10">
                  <PackageOpen className="h-4 w-4 text-red-500" />
                </div>
                Sin Existencias
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-red-500">{outOfStockCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Artículos que necesitan reposición
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="inventory" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 p-1">
            <TabsTrigger value="inventory" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Niveles de Stock</TabsTrigger>
            <TabsTrigger value="categories" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Categorías</TabsTrigger>
          </TabsList>
          
          <TabsContent value="inventory" className="mt-6">
            <Card className="border-muted/60 shadow-sm">
              <CardHeader className="pb-3 bg-gradient-to-br from-card to-muted/5">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-primary/10">
                    <PackageOpen className="h-4 w-4 text-primary" />
                  </div>
                  Estado del Inventario
                </CardTitle>
                <CardDescription className="mt-1">
                  Monitorea niveles de stock, gestiona productos y visualiza detalles de inventario
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 pb-4">
                <InventoryTable inventoryItems={safeItems} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="categories" className="mt-6">
            <CategoriesSection categories={categories} />
          </TabsContent>
        </Tabs>
      </div>
    );
  } catch (error) {
    console.error("Error al cargar datos de inventario:", error);
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold tracking-tight mb-4">Inventario</h1>
        <Card className="border-red-200 shadow-md">
          <CardHeader className="bg-red-50/50">
            <CardTitle className="text-red-500 flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-red-100">
                <PackageOpen className="h-4 w-4 text-red-500" />
              </div>
              Error al Cargar Datos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p>Hubo un problema al cargar los datos del inventario. Por favor, inténtalo de nuevo más tarde.</p>
            <p className="text-sm text-muted-foreground mt-2">{(error as Error).message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }
} 