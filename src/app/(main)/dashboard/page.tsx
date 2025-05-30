// This file is just a placeholder for now.
// We'll move the dashboard content here later.
// For now, this is used to create the file structure.

import { BarChart3, ClipboardList, PieChart, DollarSign, PlusCircle, Package, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, StatCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getAllProducts } from "@/services/productService";
import { getLowStockItems } from "@/services/inventoryService";
import { formatDate, getApiBaseUrl } from "@/lib/utils";
import { ActionLink } from "@/components/ui/action-link";
import { prisma } from "@/lib/prisma";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  margin: number;
  quantity: number;
  cost?: number;
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
  // For now, we'll show the dashboard without authentication
  // TODO: Add custom authentication check here
  
  let products: Product[] = [];
  let lowStockItems: any[] = [];
  let categories: any[] = [];

  try {
    // Obtener datos reales de la base de datos con manejo de errores
    [products, lowStockItems] = await Promise.all([
      getAllProducts(),
      getLowStockItems()
    ]) as [Product[], any[]];

    // Get categories directly from database instead of API call
    if (prisma) {
      categories = await prisma.category.findMany({
        orderBy: {
          name: "asc",
        },
      });
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    
    // Si hay error de base de datos, mostrar mensaje específico
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Error loading dashboard
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            There was a problem loading the dashboard data. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  // Calcular estadísticas
  const totalProducts = products.length;
  const totalCategories = categories.length;
  const lowStockCount = lowStockItems.length;

  // Calcular estadísticas de márgenes
  const totalMargin = products.reduce((sum: number, product: Product) => sum + Number(product.margin || 0), 0);
  const averageMargin = products.length > 0 ? (totalMargin / products.length).toFixed(2) : "0";
  
  // Calcular valor total del inventario
  const calculateInventoryValues = () => {
    let totalCostValue = 0;
    let totalSaleValue = 0;
    
    products.forEach((product) => {
      const quantity = Number(product.quantity || 0);
      const price = Number(product.price || 0);
      const cost = product.cost ? Number(product.cost) : (price * (1 - Number(product.margin || 0) / 100));
      
      totalCostValue += quantity * cost;
      totalSaleValue += quantity * price;
    });
    
    return {
      totalCostValue: totalCostValue.toFixed(2),
      totalSaleValue: totalSaleValue.toFixed(2),
      potentialProfit: (totalSaleValue - totalCostValue).toFixed(2),
    };
  };

  const inventoryValues = calculateInventoryValues();
  
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
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          <ActionLink 
            href="/reports/margins" 
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            View Margin Reports
          </ActionLink>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Products"
          value={totalProducts}
          description="Total products in inventory"
          icon={<ClipboardList className="h-5 w-5" />}
          href="/inventory"
          linkText="View all products"
        />
        
        <StatCard
          title="Low Stock Items"
          value={lowStockCount}
          description="Products below minimum level"
          icon={<ClipboardList className="h-5 w-5" />}
          trend={lowStockCount > 0 ? "down" : "neutral"}
          trendValue={lowStockCount > 0 ? `${lowStockCount} products need attention` : "Healthy stock levels"}
          href="/inventory"
          linkText="Manage inventory"
        />
        
        <StatCard
          title="Average Margin"
          value={`${averageMargin}%`}
          description="Across all products"
          icon={<DollarSign className="h-5 w-5" />}
          trend={Number(averageMargin) > 25 ? "up" : Number(averageMargin) < 15 ? "down" : "neutral"}
          trendValue={Number(averageMargin) > 25 ? "Healthy margins" : Number(averageMargin) < 15 ? "Margins need attention" : "Average margins"}
          href="/reports/margins"
          linkText="View margin details"
        />
        
        <StatCard
          title="High Margin Products"
          value={productsByCategory.HIGH}
          description={`${products.length > 0 ? ((productsByCategory.HIGH / products.length) * 100).toFixed(1) : 0}% of total`}
          icon={<PieChart className="h-5 w-5" />}
          href="/reports/margins"
          linkText="View margin data"
        />
      </div>

      {/* Inventory Value Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Inventory Cost Value"
          value={`$${Number(inventoryValues.totalCostValue).toLocaleString()}`}
          description="Total value at cost price"
          icon={<Package className="h-5 w-5" />}
          href="/inventory"
          linkText="View inventory details"
        />
        
        <StatCard
          title="Inventory Sale Value"
          value={`$${Number(inventoryValues.totalSaleValue).toLocaleString()}`}
          description="Total value at sale price"
          icon={<DollarSign className="h-5 w-5" />}
          trend="up"
          trendValue={`+$${Number(inventoryValues.potentialProfit).toLocaleString()} potential profit`}
          href="/inventory"
          linkText="View inventory details"
        />
        
        <StatCard
          title="Potential Profit"
          value={`$${Number(inventoryValues.potentialProfit).toLocaleString()}`}
          description="Sale value - Cost value"
          icon={<TrendingUp className="h-5 w-5" />}
          trend={Number(inventoryValues.potentialProfit) > 0 ? "up" : "neutral"}
          trendValue={
            Number(inventoryValues.totalCostValue) > 0 
              ? `${((Number(inventoryValues.potentialProfit) / Number(inventoryValues.totalCostValue)) * 100).toFixed(1)}% markup potential`
              : "No cost basis for calculation"
          }
          href="/reports/margins"
          linkText="View margin analysis"
        />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Products</CardTitle>
            <CardDescription>
              Latest products added to inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {products.slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.category?.name || 'No category'} • Stock: {product.quantity || 0}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${product.price}</p>
                    <Badge variant={Number(product.margin) > 25 ? "default" : Number(product.margin) < 15 ? "destructive" : "secondary"}>
                      {product.margin}% margin
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/inventory" className="text-sm text-primary hover:underline">
              View all products →
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <Link 
                href="/inventory/new" 
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <PlusCircle className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Add New Product</p>
                  <p className="text-sm text-muted-foreground">Create a new inventory item</p>
                </div>
              </Link>
              
              <Link 
                href="/reports" 
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <BarChart3 className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">View Reports</p>
                  <p className="text-sm text-muted-foreground">Analyze inventory data</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 