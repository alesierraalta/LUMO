import { BarChart3, PackageOpen, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, StatCard } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { getProductsWithLowStock } from "@/services/productService";
import { getLowStockItems, getOutOfStockItems, calculateStockStatus, StockStatus } from "@/services/inventoryService";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import PrintHeader from "@/components/reports/print-header";
import { formatCurrency, getApiBaseUrl, serializeDecimal } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import ClientReportActions from "@/components/reports/client-report-actions";
import { prisma } from "@/lib/prisma";

// Define stock status categories with colors
const STOCK_CATEGORIES: Record<string, { label: string; color: "default" | "destructive" | "outline" | "secondary" | "success" }> = {
  OUT_OF_STOCK: {
    label: "Out of Stock",
    color: "destructive",
  },
  CRITICAL: {
    label: "Critical",
    color: "destructive",
  },
  LOW: {
    label: "Low",
    color: "warning" as any, // Type cast as any since this might be a custom variant
  },
  NORMAL: {
    label: "Normal",
    color: "success",
  }
};

export default async function LowStockReportsPage() {
  try {
    // Fetch inventory data - use the new merged model approach
    let lowStockItems = await getLowStockItems();
    let outOfStockItems = await getOutOfStockItems();
    
    // Direct database query to get total count instead of using getAllProducts
    const totalProductsCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM inventory_items
    ` as any[];
    
    // Apply serialization to convert Decimal objects to plain numbers
    lowStockItems = serializeDecimal(lowStockItems);
    outOfStockItems = serializeDecimal(outOfStockItems);
    
    // Fetch categories directly using Prisma
    const categories = await prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
    });
    
    // Calculate statistics - use the count from raw query
    const totalProducts = Number(totalProductsCount[0]?.count) || 0;
    const lowStockCount = lowStockItems.length;
    const outOfStockCount = outOfStockItems.length;
    const lowStockPercentage = totalProducts > 0 ? (lowStockCount / totalProducts * 100).toFixed(1) : "0";
    
    // Group low stock items by category
    const lowStockByCategory = categories.map((category) => {
      const productsInCategory = lowStockItems.filter((item) => 
        item.categoryId === category.id
      );
      
      return {
        id: category.id,
        name: category.name,
        count: productsInCategory.length,
      };
    }).filter((cat) => cat.count > 0).sort((a, b) => b.count - a.count);
    
    // Calculate stock level distribution for visualization
    const stockLevelDistribution = [
      { name: "Out of Stock", value: outOfStockCount, color: STOCK_CATEGORIES.OUT_OF_STOCK.color },
      { name: "Low Stock", value: lowStockCount - outOfStockCount, color: STOCK_CATEGORIES.LOW.color },
      { name: "Normal Stock", value: totalProducts - lowStockCount, color: STOCK_CATEGORIES.NORMAL.color },
    ];
    
    // Prepare data for stock level vs min level chart
    const stockVsMinLevelData = lowStockItems.slice(0, 10).map((item) => ({
      name: item.name?.length > 15 ? item.name.substring(0, 15) + "..." : item.name,
      current: item.quantity,
      minimum: item.minStockLevel,
      deficit: Math.max(0, item.minStockLevel - item.quantity),
      id: item.id
    }));

    return (
      <div className="space-y-6 p-6 pb-16">
        <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:space-y-0">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Low Stock Report</h2>
            <p className="text-muted-foreground">
              Products that need to be restocked soon
            </p>
          </div>
          <ClientReportActions 
            reportType="low-stock" 
            data={lowStockItems} 
            categories={categories} 
          />
        </div>

        <div className="hidden print:block">
          <PrintHeader title="Low Stock Report" />
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {lowStockItems.map((product) => {
            const stockLevel =
              product.quantity === 0
                ? "OUT_OF_STOCK"
                : product.quantity <= (product.minStockLevel || 0) / 2
                ? "CRITICAL"
                : "LOW";

            const status = STOCK_CATEGORIES[stockLevel];

            return (
              <Card key={product.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {product.name}
                  </CardTitle>
                  <Badge variant={status.color as any}>{status.label}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {product.quantity || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Min. Level: {product.minStockLevel || 0}
                  </div>
                  <div className="mt-4 text-xs text-muted-foreground">
                    <div>SKU: {product.sku}</div>
                    <div>Price: {formatCurrency(Number(product.price))}</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in LowStockReportsPage:", error);
    throw error; // Re-throw to let Next.js error handling take over
  }
} 