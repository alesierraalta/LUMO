import { BarChart3, BoxIcon, ClipboardList, PieChart, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, StatCard } from "@/components/ui/card";
import Link from "next/link";
import { getAllProducts, getAllCategories } from "@/services/productService";
import { getLowStockItems } from "@/services/inventoryService";
import { formatDate } from "@/lib/utils";

// Define margin categories
const MARGIN_CATEGORIES = {
  LOW: { label: "Low Margin", min: 0, max: 15, color: "var(--chart-1)" },
  MEDIUM: { label: "Medium Margin", min: 15, max: 30, color: "var(--chart-2)" },
  HIGH: { label: "High Margin", min: 30, max: Infinity, color: "var(--chart-3)" }
};

export default async function DashboardPage() {
  // Obtener datos reales de la base de datos
  const [products, categories, lowStockItems] = await Promise.all([
    getAllProducts(),
    getAllCategories(),
    getLowStockItems()
  ]);

  // Calcular estadísticas
  const totalProducts = products.length;
  const totalCategories = categories.length;
  const lowStockCount = lowStockItems.length;

  // Calculate margin statistics
  const totalMargin = products.reduce((sum, product) => sum + Number(product.margin || 0), 0);
  const averageMargin = products.length > 0 ? (totalMargin / products.length).toFixed(2) : "0";
  
  // Get highest margin products
  const highestMarginProducts = [...products]
    .sort((a, b) => Number(b.margin || 0) - Number(a.margin || 0))
    .slice(0, 3);

  // Products by margin category
  const productsByCategory = {
    HIGH: products.filter(p => Number(p.margin || 0) > MARGIN_CATEGORIES.MEDIUM.max).length,
    MEDIUM: products.filter(p => Number(p.margin || 0) > MARGIN_CATEGORIES.LOW.max && Number(p.margin || 0) <= MARGIN_CATEGORIES.MEDIUM.max).length,
    LOW: products.filter(p => Number(p.margin || 0) <= MARGIN_CATEGORIES.LOW.max).length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Link href="/reports/margins">
            <button className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              View Margin Reports
            </button>
          </Link>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Products"
          value={totalProducts}
          description="Total products in inventory"
          icon={<BoxIcon className="h-5 w-5" />}
          href="/products"
          linkText="View all products"
        />
        
        <StatCard
          title="Low Stock Items"
          value={lowStockCount}
          description="Items below minimum stock level"
          icon={<ClipboardList className="h-5 w-5" />}
          trend={lowStockCount > 0 ? "down" : "neutral"}
          trendValue={lowStockCount > 0 ? `${lowStockCount} items need attention` : "Stock levels are healthy"}
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
          linkText="View all margin data"
        />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Products</CardTitle>
            <CardDescription>Latest products added</CardDescription>
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
                        : 'No description'}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(new Date(product.createdAt))}
                  </div>
                </div>
              ))}
              
              {products.length === 0 && (
                <div className="flex items-center justify-center h-24 text-muted-foreground">
                  No products found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Top Margin Products</CardTitle>
            <CardDescription>Products with highest profit margins</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {highestMarginProducts.map(product => (
                <div key={product.id} className="flex items-center gap-4 rounded-lg border p-4">
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.category?.name || "Uncategorized"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${Number(product.price).toFixed(2)}</div>
                    <div className="text-sm text-green-600 font-semibold">{Number(product.margin).toFixed(2)}% margin</div>
                  </div>
                </div>
              ))}
              
              {highestMarginProducts.length === 0 && (
                <div className="flex items-center justify-center h-24 text-muted-foreground">
                  No products with margin data
                </div>
              )}
              
              {highestMarginProducts.length > 0 && (
                <Link 
                  href="/reports/margins" 
                  className="block w-full text-center text-sm text-primary hover:underline mt-2"
                >
                  View full margin report
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common inventory tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Link 
                href="/products/add" 
                className="flex items-center gap-2 rounded-md border p-3 text-sm font-medium hover:bg-secondary"
              >
                <BoxIcon className="h-5 w-5" />
                <span>Add new product</span>
              </Link>
              <Link 
                href="/inventory" 
                className="flex items-center gap-2 rounded-md border p-3 text-sm font-medium hover:bg-secondary"
              >
                <ClipboardList className="h-5 w-5" />
                <span>Update stock levels</span>
              </Link>
              <Link 
                href="/reports/margins" 
                className="flex items-center gap-2 rounded-md border p-3 text-sm font-medium hover:bg-secondary"
              >
                <PieChart className="h-5 w-5" />
                <span>View margin reports</span>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Margin Distribution</CardTitle>
            <CardDescription>Products by margin category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(MARGIN_CATEGORIES).map(([key, category]) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span 
                        className="w-3 h-3 rounded-full inline-block"
                        style={{ backgroundColor: category.color }}
                      ></span>
                      <span className="text-sm font-medium">{category.label}</span>
                    </span>
                    <span className="text-sm font-medium">
                      {productsByCategory[key as keyof typeof productsByCategory]} products
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2.5">
                    <div 
                      className="h-2.5 rounded-full" 
                      style={{ 
                        width: `${products.length > 0 ? (productsByCategory[key as keyof typeof productsByCategory] / products.length) * 100 : 0}%`,
                        backgroundColor: category.color 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
              <Link 
                href="/reports/margins" 
                className="block w-full text-center text-sm text-primary hover:underline mt-4"
              >
                View detailed margin analysis
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 