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
import { getAllProducts, getAllCategories, getProductsWithLowStock } from "@/services/productService";
import { getLowStockItems, getOutOfStockItems, calculateStockStatus, StockStatus } from "@/services/inventoryService";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import dynamic from "next/dynamic";
import PrintHeader from "@/components/reports/print-header";
import ReportActions from "@/components/reports/report-actions";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// Client components
const ReportActions = dynamic(() => import("@/components/reports/report-actions"), { ssr: false });

// Define stock status categories with colors
const STOCK_CATEGORIES = {
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
    color: "warning",
  },
};

export default async function LowStockReportsPage() {
  // Fetch inventory data
  const [lowStockItems, outOfStockItems, allProducts, categories] = await Promise.all([
    getLowStockItems(),
    getOutOfStockItems(),
    getAllProducts(true), // Include inactive products for complete analysis
    getAllCategories()
  ]);
  
  // Calculate statistics
  const totalProducts = allProducts.length;
  const lowStockCount = lowStockItems.length;
  const outOfStockCount = outOfStockItems.length;
  const lowStockPercentage = totalProducts > 0 ? (lowStockCount / totalProducts * 100).toFixed(1) : "0";
  
  // Group low stock items by category
  const lowStockByCategory = categories.map(category => {
    const productsInCategory = lowStockItems.filter(item => 
      item.product.categoryId === category.id
    );
    
    return {
      id: category.id,
      name: category.name,
      count: productsInCategory.length,
    };
  }).filter(cat => cat.count > 0).sort((a, b) => b.count - a.count);
  
  // Calculate stock level distribution for visualization
  const stockLevelDistribution = [
    { name: "Out of Stock", value: outOfStockCount, color: STOCK_CATEGORIES.OUT_OF_STOCK.color },
    { name: "Low Stock", value: lowStockCount - outOfStockCount, color: STOCK_CATEGORIES.LOW.color },
    { name: "Normal Stock", value: totalProducts - lowStockCount, color: STOCK_CATEGORIES.NORMAL.color },
  ];
  
  // Prepare data for stock level vs min level chart
  const stockVsMinLevelData = lowStockItems.slice(0, 10).map(item => ({
    name: item.product.name.length > 15 ? item.product.name.substring(0, 15) + "..." : item.product.name,
    current: item.quantity,
    minimum: item.minStockLevel,
    deficit: Math.max(0, item.minStockLevel - item.quantity),
    id: item.id
  }));
  
  const products = await getProductsWithLowStock();

  return (
    <div className="space-y-6 p-6 pb-16">
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Low Stock Report</h2>
          <p className="text-muted-foreground">
            Products that need to be restocked soon
          </p>
        </div>
        <ReportActions />
      </div>

      <div className="hidden print:block">
        <PrintHeader title="Low Stock Report" />
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => {
          const stockLevel =
            product.inventory.quantity === 0
              ? "OUT_OF_STOCK"
              : product.inventory.quantity <= product.inventory.minStockLevel / 2
              ? "CRITICAL"
              : "LOW";

          const status = STOCK_CATEGORIES[stockLevel];

          return (
            <Card key={product.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {product.name}
                </CardTitle>
                <Badge variant={status.color}>{status.label}</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {product.inventory.quantity}
                </div>
                <div className="text-xs text-muted-foreground">
                  Min. Level: {product.inventory.minStockLevel}
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  <div>SKU: {product.sku}</div>
                  <div>Price: {formatCurrency(product.price)}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
} 