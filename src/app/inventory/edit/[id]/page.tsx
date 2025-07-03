"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    // Mock data for GitHub Pages static export
    setProduct({
      id: productId,
      name: "Sample Product",
      description: "Sample product for GitHub Pages",
      price: 10.00,
      quantity: 100
    });
    setLoading(false);
  }, [productId]);

  const handleSave = () => {
    // Mock save functionality for GitHub Pages
    alert("Product saved (GitHub Pages demo)");
    router.push("/inventory");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Product</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              value={product?.name || ""}
              onChange={(e) => setProduct({...product, name: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={product?.description || ""}
              onChange={(e) => setProduct({...product, description: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              value={product?.price || 0}
              onChange={(e) => setProduct({...product, price: parseFloat(e.target.value)})}
            />
          </div>
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={product?.quantity || 0}
              onChange={(e) => setProduct({...product, quantity: parseInt(e.target.value)})}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave}>Save Changes</Button>
            <Button variant="outline" onClick={() => router.push("/inventory")}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 