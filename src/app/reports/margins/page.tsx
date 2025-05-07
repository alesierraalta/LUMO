import { BarChart3, PieChart, DollarSign } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { getAllProducts } from "@/services/productService";
import dynamic from "next/dynamic";
import PrintHeader from "@/components/reports/print-header";
import ReportActionsClientWrapper from "@/components/reports/ReportActionsClientWrapper";
import MarginChartsClient from "@/components/reports/MarginChartsClient";
import { getApiBaseUrl } from "@/lib/utils";

// Define margin categories
const MARGIN_CATEGORIES = {
  LOW: { label: "Margen Bajo", min: 0, max: 15, color: "var(--chart-1)" },
  MEDIUM: { label: "Margen Medio", min: 15, max: 30, color: "var(--chart-2)" },
  HIGH: { label: "Margen Alto", min: 30, max: Infinity, color: "var(--chart-3)" }
};

export default async function MarginReportsPage() {
  // Fetch products data
  const products = await getAllProducts(true); // Include inactive products for complete analysis
  
  // Fetch categories data from API with proper base URL
  const apiBaseUrl = getApiBaseUrl();
  const categoriesResponse = await fetch(`${apiBaseUrl}/api/categories`);
  if (!categoriesResponse.ok) {
    throw new Error('Error al obtener categorías');
  }
  const categories = await categoriesResponse.json();
  
  // Helper function to get category for a margin value
  const getMarginCategory = (margin: number) => {
    if (margin <= MARGIN_CATEGORIES.LOW.max) return "LOW";
    if (margin <= MARGIN_CATEGORIES.MEDIUM.max) return "MEDIUM";
    return "HIGH";
  };
  
  // Process data for visualizations
  const marginDistribution = [
    { range: "0-5%", count: 0, color: MARGIN_CATEGORIES.LOW.color },
    { range: "5-10%", count: 0, color: MARGIN_CATEGORIES.LOW.color },
    { range: "10-15%", count: 0, color: MARGIN_CATEGORIES.LOW.color },
    { range: "15-20%", count: 0, color: MARGIN_CATEGORIES.MEDIUM.color },
    { range: "20-25%", count: 0, color: MARGIN_CATEGORIES.MEDIUM.color },
    { range: "25-30%", count: 0, color: MARGIN_CATEGORIES.MEDIUM.color },
    { range: "30-40%", count: 0, color: MARGIN_CATEGORIES.HIGH.color },
    { range: "40-50%", count: 0, color: MARGIN_CATEGORIES.HIGH.color },
    { range: "50%+", count: 0, color: MARGIN_CATEGORIES.HIGH.color },
  ];
  
  // Count products by margin range
  products.forEach(product => {
    const margin = Number(product.margin);
    if (margin <= 5) marginDistribution[0].count++;
    else if (margin <= 10) marginDistribution[1].count++;
    else if (margin <= 15) marginDistribution[2].count++;
    else if (margin <= 20) marginDistribution[3].count++;
    else if (margin <= 25) marginDistribution[4].count++;
    else if (margin <= 30) marginDistribution[5].count++;
    else if (margin <= 40) marginDistribution[6].count++;
    else if (margin <= 50) marginDistribution[7].count++;
    else marginDistribution[8].count++;
  });
  
  // Calculate statistics
  const productsByCategory = {
    LOW: products.filter(p => Number(p.margin) <= MARGIN_CATEGORIES.LOW.max),
    MEDIUM: products.filter(p => Number(p.margin) > MARGIN_CATEGORIES.LOW.max && Number(p.margin) <= MARGIN_CATEGORIES.MEDIUM.max),
    HIGH: products.filter(p => Number(p.margin) > MARGIN_CATEGORIES.MEDIUM.max)
  };
  
  const pieChartData = [
    { name: MARGIN_CATEGORIES.LOW.label, value: productsByCategory.LOW.length, color: MARGIN_CATEGORIES.LOW.color },
    { name: MARGIN_CATEGORIES.MEDIUM.label, value: productsByCategory.MEDIUM.length, color: MARGIN_CATEGORIES.MEDIUM.color },
    { name: MARGIN_CATEGORIES.HIGH.label, value: productsByCategory.HIGH.length, color: MARGIN_CATEGORIES.HIGH.color },
  ];
  
  // Calculate average margin (safely)
  const totalMargin = products.reduce((sum, product) => {
    const margin = Number(product.margin) || 0;
    return sum + margin;
  }, 0);
  const averageMargin = products.length > 0 ? (totalMargin / products.length).toFixed(2) : "0";
  
  // Calculate average margins by category (safely)
  const avgMarginByCategory = {
    LOW: productsByCategory.LOW.length > 0 
      ? (productsByCategory.LOW.reduce((sum, p) => sum + (Number(p.margin) || 0), 0) / productsByCategory.LOW.length).toFixed(2) 
      : "0",
    MEDIUM: productsByCategory.MEDIUM.length > 0 
      ? (productsByCategory.MEDIUM.reduce((sum, p) => sum + (Number(p.margin) || 0), 0) / productsByCategory.MEDIUM.length).toFixed(2) 
      : "0",
    HIGH: productsByCategory.HIGH.length > 0 
      ? (productsByCategory.HIGH.reduce((sum, p) => sum + (Number(p.margin) || 0), 0) / productsByCategory.HIGH.length).toFixed(2) 
      : "0"
  };
  
  // For category-based margin analysis
  const categoriesWithStats = categories.map(category => {
    const productsInCategory = products.filter(p => p.categoryId === category.id);
    const avgMargin = productsInCategory.length > 0 
      ? (productsInCategory.reduce((sum, p) => sum + Number(p.margin), 0) / productsInCategory.length).toFixed(2)
      : "0";
    
    return {
      ...category,
      productCount: productsInCategory.length,
      avgMargin
    };
  }).sort((a, b) => Number(b.avgMargin) - Number(a.avgMargin));
  
  return (
    <div className="space-y-6">
      {/* Print Header - only visible when printing */}
      <PrintHeader reportType="margins" />
      
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Reportes de Márgenes</h1>
        <ReportActionsClientWrapper 
          reportType="margins" 
          data={products} 
          categories={categories} 
        />
      </div>
      
      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Margen Promedio"
          value={`${averageMargin}%`}
          description="En todos los productos"
          icon={<BarChart3 className="h-5 w-5" />}
        />
        
        <StatCard
          title="Producto con Mayor Margen"
          value={products.length > 0 
            ? `${products.sort((a, b) => Number(b.margin) - Number(a.margin))[0].name}`
            : "N/A"
          }
          description={products.length > 0 
            ? `${Number(products.sort((a, b) => Number(b.margin) - Number(a.margin))[0].margin).toFixed(2)}%`
            : ""}
          icon={<DollarSign className="h-5 w-5" />}
        />
        
        <StatCard
          title="Productos con Alto Margen"
          value={productsByCategory.HIGH.length}
          description={`${(productsByCategory.HIGH.length / products.length * 100).toFixed(1)}% del total de productos`}
          icon={<PieChart className="h-5 w-5" />}
          trend={productsByCategory.HIGH.length > products.length * 0.3 ? "up" : "neutral"}
          trendValue={`Prom. ${avgMarginByCategory.HIGH}% margen`}
        />
      </div>
      
      {/* Charts */}
      <MarginChartsClient marginDistribution={marginDistribution} pieChartData={pieChartData} />
      
      {/* Category-based Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Categorías por Margen Promedio</CardTitle>
          <CardDescription>Análisis de categorías de productos por rentabilidad</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoría</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead>Margen Promedio</TableHead>
                <TableHead>Clasificación de Margen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoriesWithStats.map(category => {
                const marginCategory = getMarginCategory(Number(category.avgMargin));
                return (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.productCount}</TableCell>
                    <TableCell>{category.avgMargin}%</TableCell>
                    <TableCell>
                      <span 
                        className="px-2 py-1 rounded-full text-xs"
                        style={{ 
                          backgroundColor: `${MARGIN_CATEGORIES[marginCategory].color}40`,
                          color: MARGIN_CATEGORIES[marginCategory].color 
                        }}
                      >
                        {MARGIN_CATEGORIES[marginCategory].label}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
              {categoriesWithStats.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No se encontraron categorías.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Product Breakdown by Margin Category */}
      <Card>
        <CardHeader>
          <CardTitle>Productos por Categoría de Margen</CardTitle>
          <CardDescription>Desglose detallado de productos en cada categoría de margen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(productsByCategory).map(([category, prods]) => (
              <div key={category} className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span 
                    className="w-3 h-3 rounded-full inline-block"
                    style={{ backgroundColor: MARGIN_CATEGORIES[category as keyof typeof MARGIN_CATEGORIES].color }}
                  ></span>
                  {MARGIN_CATEGORIES[category as keyof typeof MARGIN_CATEGORIES].label} 
                  <span className="text-sm font-normal text-muted-foreground">
                    ({prods.length} productos, prom. {avgMarginByCategory[category as keyof typeof avgMarginByCategory]}%)
                  </span>
                </h3>
                
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Costo</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Margen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prods.slice(0, 5).map(product => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.sku}</TableCell>
                          <TableCell>
                            {product.category ? (
                              product.category.name
                            ) : (
                              <Badge variant="outline" className="text-xs">Sin categoría</Badge>
                            )}
                          </TableCell>
                          <TableCell>${Number(product.cost).toFixed(2)}</TableCell>
                          <TableCell>${Number(product.price).toFixed(2)}</TableCell>
                          <TableCell>{Number(product.margin).toFixed(2)}%</TableCell>
                        </TableRow>
                      ))}
                      {prods.length > 5 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-2">
                            <span className="text-sm text-muted-foreground">
                              Y {prods.length - 5} más productos...
                            </span>
                          </TableCell>
                        </TableRow>
                      )}
                      {prods.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            No hay productos en esta categoría.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 