"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MarginsReportPage() {
  const [loading, setLoading] = useState(true);
  const [marginsData, setMarginsData] = useState<any[]>([]);

  useEffect(() => {
    // Mock data for Vercel deployment
    const mockMargins = [
      {
        id: "1",
        productName: "Sample Product A",
        cost: 15.00,
        price: 25.00,
        margin: 10.00,
        marginPercentage: 40.0
      },
      {
        id: "2",
        productName: "Sample Product B", 
        cost: 30.00,
        price: 45.00,
        margin: 15.00,
        marginPercentage: 33.3
      }
    ];
    
    setMarginsData(mockMargins);
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="p-6">Loading margins report...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Margins Report</h2>
        <p className="text-muted-foreground">
          Product profit margins and cost analysis
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {marginsData.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {item.productName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Cost:</span>
                  <span className="text-sm">${item.cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Price:</span>
                  <span className="text-sm">${item.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Margin:</span>
                  <span className="text-sm font-semibold">${item.margin.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Margin %:</span>
                  <span className="text-sm font-semibold">{item.marginPercentage.toFixed(1)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 