"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LocationInventoryPage() {
  const router = useRouter();
  const params = useParams();
  const inventoryId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [inventoryItem, setInventoryItem] = useState<any>(null);
  const [location, setLocation] = useState<string>("");

  useEffect(() => {
    // Mock data for GitHub Pages static export
    setInventoryItem({
      id: inventoryId,
      name: "Sample Product",
      currentLocation: "Warehouse A",
      quantity: 50
    });
    setLocation("Warehouse A");
    setLoading(false);
  }, [inventoryId]);

  const handleUpdateLocation = () => {
    // Mock update functionality for GitHub Pages
    alert(`Location updated to: ${location} (GitHub Pages demo)`);
    router.push("/inventory");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Update Item Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>Item:</strong> {inventoryItem?.name}
          </div>
          <div>
            <strong>Current Quantity:</strong> {inventoryItem?.quantity}
          </div>
          <div>
            <strong>Current Location:</strong> {inventoryItem?.currentLocation}
          </div>
          <div>
            <Label htmlFor="location">New Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter new location"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleUpdateLocation}>Update Location</Button>
            <Button variant="outline" onClick={() => router.push("/inventory")}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 