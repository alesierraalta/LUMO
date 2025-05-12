// This file is just a placeholder for now.
// We'll move the dashboard content here later.
// For now, this is used to create the file structure.

import { BarChart3, ClipboardList, PieChart, DollarSign, PlusCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, StatCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getAllProducts } from "@/services/productService";
import { getLowStockItems } from "@/services/inventoryService";
import { formatDate, getApiBaseUrl } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  margin: number;
  createdAt: string;
  category?: {
    name: string;
  };
}

// Define categorías de márgenes
const MARGIN_CATEGORIES = {
  LOW: { label: "Margen Bajo", min: 0, max: 15, color: "var(--chart-1)" },
  MEDIUM: { label: "Margen Medio", min: 15, max: 30, color: "var(--chart-2)" },
  HIGH: { label: "Margen Alto", min: 30, max: Infinity, color: "var(--chart-3)" }
};

export default async function DashboardPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }
  
  // Obtener datos reales de la base de datos
  const [products, lowStockItems] = await Promise.all([
    getAllProducts(),
    getLowStockItems()
  ]) as [Product[], any[]];

  // Fetch categories from API with proper base URL
  const apiBaseUrl = getApiBaseUrl();
  const categoriesResponse = await fetch(`${apiBaseUrl}/api/categories`);
  if (!categoriesResponse.ok) {
    throw new Error('Error al obtener categorías');
  }
  const categories = await categoriesResponse.json();

  // Calcular estadísticas
  const totalProducts = products.length;
  const totalCategories = categories.length;
  const lowStockCount = lowStockItems.length;

  // Calcular estadísticas de márgenes
  const totalMargin = products.reduce((sum: number, product: Product) => sum + Number(product.margin || 0), 0);
  const averageMargin = products.length > 0 ? (totalMargin / products.length).toFixed(2) : "0";
  
  // Obtener productos con mayor margen
  const highestMarginProducts = [...products]
    .sort((a, b) => Number(b.margin || 0) - Number(a.margin || 0))
    .slice(0, 3);

  // Productos por categoría de margen
  const productsByCategory = {
    HIGH: products.filter((p: Product) => Number(p.margin || 0) > MARGIN_CATEGORIES.MEDIUM.max).length,
    MEDIUM: products.filter((p: Product) => Number(p.margin || 0) > MARGIN_CATEGORIES.LOW.max && Number(p.margin || 0) <= MARGIN_CATEGORIES.MEDIUM.max).length,
    LOW: products.filter((p: Product) => Number(p.margin || 0) <= MARGIN_CATEGORIES.LOW.max).length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
        <div className="flex items-center gap-2">
          <Link href="/reports/margins">
            <button className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Ver Reportes de Margen
            </button>
          </Link>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Productos"
          value={totalProducts}
          description="Productos totales en inventario"
          icon={<ClipboardList className="h-5 w-5" />}
          href="/inventory"
          linkText="Ver todos los productos"
        />
        
        <StatCard
          title="Productos con Stock Bajo"
          value={lowStockCount}
          description="Productos por debajo del nivel mínimo"
          icon={<ClipboardList className="h-5 w-5" />}
          trend={lowStockCount > 0 ? "down" : "neutral"}
          trendValue={lowStockCount > 0 ? `${lowStockCount} productos requieren atención` : "Niveles de stock saludables"}
          href="/inventory"
          linkText="Administrar inventario"
        />
        
        <StatCard
          title="Margen Promedio"
          value={`${averageMargin}%`}
          description="En todos los productos"
          icon={<DollarSign className="h-5 w-5" />}
          trend={Number(averageMargin) > 25 ? "up" : Number(averageMargin) < 15 ? "down" : "neutral"}
          trendValue={Number(averageMargin) > 25 ? "Márgenes saludables" : Number(averageMargin) < 15 ? "Márgenes requieren atención" : "Márgenes promedio"}
          href="/reports/margins"
          linkText="Ver detalles de márgenes"
        />
        
        <StatCard
          title="Productos con Alto Margen"
          value={productsByCategory.HIGH}
          description={`${products.length > 0 ? ((productsByCategory.HIGH / products.length) * 100).toFixed(1) : 0}% del total`}
          icon={<PieChart className="h-5 w-5" />}
          href="/reports/margins"
          linkText="Ver datos de márgenes"
        />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Productos Recientes</CardTitle>
            <CardDescription>Últimos productos añadidos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {products.slice(0, 3).map(product => (
                <div key={product.id} className="flex items-start gap-4 rounded-lg border p-4">
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.description ? 
                        product.description.length > 60 ? 
                          `${product.description.substring(0, 60)}...` : 
                          product.description 
                        : 'Sin descripción'}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {product.createdAt ? formatDate(product.createdAt) : 'Fecha no disponible'}
                  </div>
                </div>
              ))}
              
              {products.length === 0 && (
                <div className="flex items-center justify-center h-24 text-muted-foreground">
                  No se encontraron productos
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Productos con Mayor Margen</CardTitle>
            <CardDescription>Productos con márgenes de beneficio más altos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {highestMarginProducts.map(product => (
                <div key={product.id} className="flex items-center gap-4 rounded-lg border p-4">
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">{product.name}</p>
                    <div className="text-sm text-muted-foreground">
                      {product.category ? (
                        product.category.name
                      ) : (
                        <Badge variant="outline" className="text-xs">Sin categoría</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${Number(product.price).toFixed(2)}</div>
                    <div className="text-sm text-green-600 font-semibold">{Number(product.margin).toFixed(2)}% margen</div>
                  </div>
                </div>
              ))}
              
              {highestMarginProducts.length === 0 && (
                <div className="flex items-center justify-center h-24 text-muted-foreground">
                  No hay productos con datos de margen
                </div>
              )}
              
              {highestMarginProducts.length > 0 && (
                <Link 
                  href="/reports/margins" 
                  className="block w-full text-center text-sm text-primary hover:underline mt-2"
                >
                  Ver reporte completo de márgenes
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Tareas comunes de inventario</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Link 
                href="/inventory/add" 
                className="flex items-center gap-2 rounded-md border p-3 text-sm font-medium hover:bg-secondary"
              >
                <PlusCircle className="h-5 w-5" />
                <span>Añadir nuevo producto</span>
              </Link>
              <Link 
                href="/inventory" 
                className="flex items-center gap-2 rounded-md border p-3 text-sm font-medium hover:bg-secondary"
              >
                <ClipboardList className="h-5 w-5" />
                <span>Actualizar niveles de stock</span>
              </Link>
              <Link 
                href="/reports/margins" 
                className="flex items-center gap-2 rounded-md border p-3 text-sm font-medium hover:bg-secondary"
              >
                <PieChart className="h-5 w-5" />
                <span>Ver reportes de márgenes</span>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Márgenes</CardTitle>
            <CardDescription>Productos por categoría de margen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(MARGIN_CATEGORIES).map(([key, category]) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }}></div>
                      <span>{category.label}</span>
                    </span>
                    <span>{productsByCategory[key as keyof typeof productsByCategory]}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div 
                      className="h-full rounded-full" 
                      style={{ 
                        width: `${products.length > 0 ? (productsByCategory[key as keyof typeof productsByCategory] / products.length) * 100 : 0}%`,
                        backgroundColor: category.color 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 