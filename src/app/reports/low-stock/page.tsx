"use client";

import { useState, useEffect } from "react";
import { BarChart3, PackageOpen, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Define stock status categories with colors
const STOCK_CATEGORIES: Record<string, { label: string; color: "default" | "destructive" | "outline" | "secondary" }> = {
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
    color: "outline",
  },
  NORMAL: {
    label: "Normal",
    color: "default",
  }
};

export default function LowStockReportsPage() {
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for Vercel deployment
    const mockLowStockItems = [
      {
        id: "1",
        name: "Sample Product A",
        quantity: 2,
        minStockLevel: 10,
        sku: "SKU001",
        price: 25.99
      },
      {
        id: "2", 
        name: "Sample Product B",
        quantity: 0,
        minStockLevel: 5,
        sku: "SKU002",
        price: 45.50
      },
      {
        id: "3",
        name: "Sample Product C", 
        quantity: 1,
        minStockLevel: 8,
        sku: "SKU003",
        price: 15.75
      }
    ];
    
    setLowStockItems(mockLowStockItems);
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="p-6">Loading low stock report...</div>;
  }

  return (
    <div className="space-y-6 p-6 pb-16">
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Low Stock Report</h2>
          <p className="text-muted-foreground">
            Products that need to be restocked soon
          </p>
        </div>
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
                  <div>Price: ${product.price?.toFixed(2)}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {lowStockItems.length === 0 && (
        <div className="text-center py-8">
          <PackageOpen className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-muted-foreground">No low stock items</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            All products are well stocked.
          </p>
        </div>
      )}
    </div>
  );
} 