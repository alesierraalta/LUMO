"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SaleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const saleId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [sale, setSale] = useState<any>(null);

  useEffect(() => {
    // Mock data for GitHub Pages static export
    setSale({
      id: saleId,
      customerName: "Sample Customer",
      date: new Date().toISOString().split('T')[0],
      total: 150.00,
      items: [
        { name: "Product A", quantity: 2, price: 50.00 },
        { name: "Product B", quantity: 1, price: 50.00 }
      ]
    });
    setLoading(false);
  }, [saleId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Sale Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>Sale ID:</strong> {sale?.id}
          </div>
          <div>
            <strong>Customer:</strong> {sale?.customerName}
          </div>
          <div>
            <strong>Date:</strong> {sale?.date}
          </div>
          <div>
            <strong>Total:</strong> ${sale?.total?.toFixed(2)}
          </div>
          <div>
            <strong>Items:</strong>
            <ul className="mt-2 space-y-1">
              {sale?.items?.map((item: any, index: number) => (
                <li key={index} className="flex justify-between">
                  <span>{item.name} (x{item.quantity})</span>
                  <span>${item.price?.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
          <Button onClick={() => router.push("/inventory/sales")}>
            Back to Sales
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 