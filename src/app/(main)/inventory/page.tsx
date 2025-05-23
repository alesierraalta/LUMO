import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle, Filter, Tags, Plus, Tag, Pencil, PackageOpen, BarChart3, BatteryLow, MapPin } from "lucide-react";
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
import { checkPermissionsWithDebug } from "@/components/auth/check-permissions-debug";
import InventoryClientWrapper from "./client-wrapper";

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 shadow-sm">
            <Tag className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Categorías de Productos
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Organiza tu inventario con categorías
              <Badge variant="outline" className="ml-2 font-medium text-xs bg-background">
                {categories.length} disponibles
              </Badge>
            </p>
          </div>
        </div>
        <Button 
          asChild 
          className="mt-4 sm:mt-0 transition-all hover:shadow-md bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
        >
          <Link href="/categories/add" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Añadir Categoría</span>
          </Link>
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border-2 border-dashed border-primary/20 transition-all overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background/80 opacity-70"></div>
          
          <div className="relative z-10">
            <div className="p-5 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 shadow-md mb-6 relative">
              <div className="absolute inset-0 rounded-full animate-pulse bg-primary/5"></div>
              <Tag className="h-16 w-16 text-primary" />
            </div>
            
            <h3 className="text-2xl font-semibold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              No Se Encontraron Categorías
            </h3>
            
            <p className="text-muted-foreground mb-8 max-w-md mx-auto px-6 leading-relaxed">
              Aún no has creado categorías de productos. Las categorías te ayudan a organizar tu inventario de manera eficiente y facilitar la búsqueda de productos.
            </p>
            
            <Button 
              asChild 
              size="lg" 
              className="px-6 py-6 h-auto text-base transition-all duration-300 hover:shadow-lg bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
            >
              <Link href="/categories/add" className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-primary-foreground/20">
                  <Plus className="h-4 w-4" />
                </div>
                <span>Crear Primera Categoría</span>
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(category => (
            <Card 
              key={category.id} 
              className="group overflow-hidden transition-all duration-300 hover:shadow-xl border border-border/40 hover:border-primary/30 relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              
              <CardHeader className="pb-2 space-y-2 relative z-10">
                <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full opacity-70 transform translate-x-6 -translate-y-6" />
                
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2.5 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 group-hover:from-primary/30 group-hover:to-primary/10 transition-colors duration-300 shadow-sm">
                    <Tag className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-semibold">{category.name}</span>
                </CardTitle>
                
                {category.description && (
                  <CardDescription className="line-clamp-2 text-sm">
                    {category.description}
                  </CardDescription>
                )}
              </CardHeader>
              
              <CardContent className="py-4 relative z-10">
                <div className="min-h-[60px] flex items-center">
                  {!category.description && (
                    <p className="text-muted-foreground text-sm italic">Sin descripción</p>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="border-t p-4 flex justify-between items-center bg-muted/5 relative z-10">
                <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5 bg-background/80 shadow-sm group-hover:bg-background group-hover:shadow-md transition-all duration-300">
                  <PackageOpen className="h-3.5 w-3.5 text-primary/70" />
                  <span className="text-xs font-medium">{category._count?.inventory || 0} productos</span>
                </Badge>
                
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" asChild className="h-9 px-2.5 rounded-md hover:bg-background">
                    <Link href={`/categories/edit/${category.id}`}>
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Editar
                    </Link>
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline" 
                    asChild 
                    className="h-9 px-4 rounded-md bg-gradient-to-br from-background to-muted hover:from-primary hover:to-primary hover:text-primary-foreground transition-all duration-300 shadow-sm hover:shadow-md"
                  >
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
      
      <div className="flex justify-center mt-10">
        <Button 
          variant="outline" 
          size="lg" 
          asChild 
          className="px-8 py-6 h-auto text-base rounded-lg bg-gradient-to-br from-background to-muted/50 hover:from-primary/5 hover:to-primary/10 transition-all duration-300 hover:shadow-md border-primary/20 hover:border-primary/30"
        >
          <Link href="/categories" className="flex items-center gap-2">
            <span>Ver Todas las Categorías</span>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1">
              <path d="M8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L8.85355 11.8536C8.65829 12.0488 8.34171 12.0488 8.14645 11.8536C7.95118 11.6583 7.95118 11.3417 8.14645 11.1464L11.2929 8H2.5C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H11.2929L8.14645 3.85355C7.95118 3.65829 7.95118 3.34171 8.14645 3.14645Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
            </svg>
          </Link>
        </Button>
      </div>
    </div>
  );
}

// Componente Sección de Ubicaciones
function LocationsSection({ locations }: { locations: any[] }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 shadow-sm">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Ubicaciones de Almacén
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Gestiona las ubicaciones físicas de tu inventario
              <Badge variant="outline" className="ml-2 font-medium text-xs bg-background">
                {locations.length} disponibles
              </Badge>
            </p>
          </div>
        </div>
        <Button 
          asChild 
          className="mt-4 sm:mt-0 transition-all hover:shadow-md bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
        >
          <Link href="/locations" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Añadir Ubicación</span>
          </Link>
        </Button>
      </div>

      {locations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border-2 border-dashed border-primary/20 transition-all overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background/80 opacity-70"></div>
          
          <div className="relative z-10">
            <div className="p-5 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 shadow-md mb-6 relative">
              <div className="absolute inset-0 rounded-full animate-pulse bg-primary/5"></div>
              <MapPin className="h-16 w-16 text-primary" />
            </div>
            
            <h3 className="text-2xl font-semibold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              No Se Encontraron Ubicaciones
            </h3>
            
            <p className="text-muted-foreground mb-8 max-w-md mx-auto px-6 leading-relaxed">
              Aún no has creado ubicaciones de almacén. Las ubicaciones te ayudan a organizar físicamente tu inventario y facilitar la búsqueda de productos.
            </p>
            
            <Button 
              asChild 
              size="lg" 
              className="px-6 py-6 h-auto text-base transition-all duration-300 hover:shadow-lg bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
            >
              <Link href="/locations" className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-primary-foreground/20">
                  <Plus className="h-4 w-4" />
                </div>
                <span>Crear Primera Ubicación</span>
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map(location => (
            <Card 
              key={location.id} 
              className="group overflow-hidden transition-all duration-300 hover:shadow-xl border border-border/40 hover:border-primary/30 relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              
              <CardHeader className="pb-2 space-y-2 relative z-10">
                <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full opacity-70 transform translate-x-6 -translate-y-6" />
                
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2.5 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 group-hover:from-primary/30 group-hover:to-primary/10 transition-colors duration-300 shadow-sm">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-semibold">{location.name}</span>
                </CardTitle>
                
                {location.description && !location.description.includes("migrada automáticamente") && (
                  <CardDescription className="line-clamp-2 text-sm">
                    {location.description}
                  </CardDescription>
                )}
              </CardHeader>
              
              <CardContent className="py-4 relative z-10">
                <div className="min-h-[60px] flex items-center">
                  {!location.description || location.description.includes("migrada automáticamente") ? (
                    <p className="text-muted-foreground text-sm italic">Sin descripción</p>
                  ) : null}
                </div>
              </CardContent>
              
              <CardFooter className="border-t p-4 flex justify-between items-center bg-muted/5 relative z-10">
                <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5 bg-background/80 shadow-sm group-hover:bg-background group-hover:shadow-md transition-all duration-300">
                  <PackageOpen className="h-3.5 w-3.5 text-primary/70" />
                  <span className="text-xs font-medium">{location._count?.inventory || 0} productos</span>
                </Badge>
                
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" asChild className="h-9 px-2.5 rounded-md hover:bg-background">
                    <Link href="/locations">
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Gestionar
                    </Link>
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline" 
                    asChild 
                    className="h-9 px-4 rounded-md bg-gradient-to-br from-background to-muted hover:from-primary hover:to-primary hover:text-primary-foreground transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    <Link href={`/inventory?location=${location.id}`}>
                      Ver
                    </Link>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      <div className="flex justify-center mt-10">
        <Button 
          variant="outline" 
          size="lg" 
          asChild 
          className="px-8 py-6 h-auto text-base rounded-lg bg-gradient-to-br from-background to-muted/50 hover:from-primary/5 hover:to-primary/10 transition-all duration-300 hover:shadow-md border-primary/20 hover:border-primary/30"
        >
          <Link href="/locations" className="flex items-center gap-2">
            <span>Gestionar Todas las Ubicaciones</span>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1">
              <path d="M8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L8.85355 11.8536C8.65829 12.0488 8.34171 12.0488 8.14645 11.8536C7.95118 11.6583 7.95118 11.3417 8.14645 11.1464L11.2929 8H2.5C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H11.2929L8.14645 3.85355C7.95118 3.65829 7.95118 3.34171 8.14645 3.14645Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
            </svg>
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default async function InventoryPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  // Get the tab from the URL parameters, defaulting to 'all'
  const resolvedSearchParams = await searchParams;
  const activeTab = resolvedSearchParams.tab === 'normal' || 
                   resolvedSearchParams.tab === 'low' || 
                   resolvedSearchParams.tab === 'out_of_stock' 
                   ? resolvedSearchParams.tab 
                   : 'all';

  // Verificar permisos para mostrar datos reales
  const authCheck = await checkPermissionsWithDebug("admin");

  try {
    let inventoryItems: any[] = [];
    let categories: any[] = [];
    let locations: any[] = [];

    // Solo cargar datos si el usuario está autorizado
    if (authCheck.authorized) {
      // Consulta optimizada con todas las relaciones necesarias
      inventoryItems = await prisma.$queryRaw`
        SELECT 
          i.id,
          i.name,
          i.description,
          i.sku,
          i.price,
          i.cost,
          i.margin,
          i."categoryId",
          i."locationId",
          i.location as legacy_location,
          i.quantity,
          i."minStockLevel",
          i."lastUpdated",
          i.active,
          i."createdAt",
          i."updatedAt",
          c.name as category_name,
          l.name as location_name,
          l.description as location_description
        FROM inventory_items i
        LEFT JOIN categories c ON i."categoryId" = c.id
        LEFT JOIN locations l ON i."locationId" = l.id
        WHERE i.active = true
        ORDER BY i."updatedAt" DESC
      ` as any[];

      // Obtener categorías con recuento de inventario
      categories = await prisma.category.findMany({
        include: {
          _count: {
            select: { inventory: true }
          }
        }
      }) as any[];

      // Obtener ubicaciones con recuento de inventario
      locations = await prisma.location.findMany({
        include: {
          _count: {
            select: { inventory: true }
          }
        }
      }) as any[];
    }

    // Unión manual para evitar problemas de serialización (solo si hay datos)
    const itemsWithCategories = authCheck.authorized 
      ? inventoryItems.map(item => {
          const category = item.category_name 
            ? { id: item.categoryId, name: item.category_name }
            : null;

          const location = item.location_name
            ? { 
                id: item.locationId, 
                name: item.location_name, 
                description: item.location_description 
              }
            : null;
          
          return {
            ...item,
            category,
            locationRelation: location,
            // Mantener compatibilidad con el campo legacy
            location: item.legacy_location || item.location_name
          };
        })
      : [];
    
    // Filtrar los datos para los conteos (o usar 0 si no hay datos)
    const lowStockCount = authCheck.authorized 
      ? inventoryItems.filter(item => item.quantity <= item.minStockLevel && item.quantity > 0).length
      : 0;

    const outOfStockCount = authCheck.authorized 
      ? inventoryItems.filter(item => item.quantity <= 0).length
      : 0;

    const activeItemsCount = authCheck.authorized 
      ? inventoryItems.filter(item => item.active === true).length
      : 0;

    // Serialización segura
    const safeItems = safeSerializeInventory(itemsWithCategories);

    return (
      <div className="space-y-8">
        {/* Encabezado con título y botones de acción */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 bg-gradient-to-r from-background to-muted/20 p-5 rounded-lg shadow-sm border border-muted/30">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">Inventario y Existencias</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona tus niveles de inventario, ubicaciones y productos
              {!authCheck.authorized && (
                <span className="block mt-2 font-medium text-yellow-600">
                  Necesitas permisos para ver los datos del inventario
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Button asChild className="transition-all hover:shadow-md" disabled={!authCheck.authorized}>
              <Link href="/inventory/add" className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                <span>Nuevo Item</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Targetas de estadísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Targeta estadística - Total en inventario */}
          <Card className="shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-tr from-card to-background">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
              <CardTitle className="text-sm font-medium">
                Total Items en Inventario
              </CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-primary"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeItems.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {activeItemsCount} productos activos
              </p>
            </CardContent>
          </Card>
          
          {/* Targeta estadística - Bajo stock */}
          <Link href="/inventory?tab=low" className="transition-all">
            <Card className="shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-tr from-card to-background">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
                <CardTitle className="text-sm font-medium">
                  Bajo Stock
                </CardTitle>
                <BatteryLow className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{lowStockCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Inventario por debajo del mínimo
                </p>
              </CardContent>
            </Card>
          </Link>
          
          {/* Targeta estadística - Sin stock */}
          <Link href="/inventory?tab=out_of_stock" className="transition-all">
            <Card className="shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-tr from-card to-background">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
                <CardTitle className="text-sm font-medium">
                  Sin Existencias
                </CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-destructive"
                >
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <path d="M2 10h20" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{outOfStockCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Productos agotados
                </p>
              </CardContent>
            </Card>
          </Link>
          
          {/* Targeta estadística - Categorías */}
          <Card className="shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-tr from-card to-background">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
              <CardTitle className="text-sm font-medium">
                Categorías
              </CardTitle>
              <Tags className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                De productos disponibles
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de inventario */}
        <Card className="shadow-sm hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle>Inventario</CardTitle>
            <CardDescription>
              Gestiona tus productos y existencias
              {!authCheck.authorized && (
                <span className="block mt-2 font-medium text-yellow-600">
                  Necesitas permisos de administrador para ver datos del inventario
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InventoryClientWrapper 
              inventoryItems={safeItems} 
              allCategories={categories} 
              initialTab={activeTab as 'all' | 'normal' | 'low' | 'out_of_stock'} 
            />
          </CardContent>
        </Card>

        {/* Sección de categorías */}
        <CategoriesSection categories={categories} />

        {/* Sección de ubicaciones */}
        <LocationsSection locations={locations} />
      </div>
    );
  } catch (error) {
    console.error("Error cargando datos de inventario:", error);
    return (
      <div className="p-4 rounded-md bg-destructive/10 text-destructive border border-destructive/20">
        <h3 className="font-semibold">Error al cargar los datos</h3>
        <p>Ocurrió un problema al cargar la información del inventario.</p>
      </div>
    );
  }
} 