"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RemoveStockPage() {
  const router = useRouter();
  const params = useParams();
  const inventoryId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [inventoryItem, setInventoryItem] = useState<any>(null);
  const [quantity, setQuantity] = useState<number>(0);

  useEffect(() => {
    // Mock data for GitHub Pages static export
    setInventoryItem({
      id: inventoryId,
      name: "Sample Product",
      currentQuantity: 100
    });
    setLoading(false);
  }, [inventoryId]);

  const handleRemoveStock = () => {
    // Mock remove stock functionality for GitHub Pages
    alert(`Removed ${quantity} units from inventory (GitHub Pages demo)`);
    router.push("/inventory");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Remove Stock</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>Item:</strong> {inventoryItem?.name}
          </div>
          <div>
            <strong>Current Quantity:</strong> {inventoryItem?.currentQuantity}
          </div>
          <div>
            <Label htmlFor="quantity">Quantity to Remove</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              placeholder="Enter quantity to remove"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleRemoveStock}>Remove Stock</Button>
            <Button variant="outline" onClick={() => router.push("/inventory")}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 