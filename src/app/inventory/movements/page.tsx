"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Package, TrendingUp, TrendingDown, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StockMovement {
  id: string;
  inventoryItemId: string;
  movementType: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  previousStock: number;
  newStock: number;
  notes?: string;
  createdAt: string;
  inventoryItem: {
    id: string;
    name: string;
    sku: string;
  };
}

export default function MovementsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredMovements, setFilteredMovements] = useState<StockMovement[]>([]);

  useEffect(() => {
    fetchMovements();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = movements.filter(movement =>
        movement.inventoryItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movement.inventoryItem.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movement.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMovements(filtered);
    } else {
      setFilteredMovements(movements);
    }
  }, [searchTerm, movements]);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/inventory/movements');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.success && data.movements) {
        setMovements(data.movements);
        setFilteredMovements(data.movements);
      } else {
        throw new Error('Failed to load movements');
      }
    } catch (error) {
      console.error('Error fetching movements:', error);
      toast({
        title: 'Error',
        description: 'Failed to load stock movements',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'IN':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'OUT':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'ADJUSTMENT':
        return <Package className="h-4 w-4 text-blue-600" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getMovementBadge = (type: string) => {
    switch (type) {
      case 'IN':
        return <Badge variant="default" className="bg-green-100 text-green-800">Stock In</Badge>;
      case 'OUT':
        return <Badge variant="destructive">Stock Out</Badge>;
      case 'ADJUSTMENT':
        return <Badge variant="secondary">Adjustment</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading stock movements...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push('/inventory')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Inventory
        </Button>
        <h1 className="text-2xl font-bold">Stock Movements</h1>
        <p className="text-muted-foreground">
          Track all inventory stock movements and adjustments
        </p>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by product name, SKU, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Movements List */}
      <div className="space-y-4">
        {filteredMovements.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'No movements found matching your search' : 'No stock movements found'}
                </p>
                {!searchTerm && (
                  <Button onClick={() => router.push('/inventory')}>
                    Go to Inventory
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredMovements.map((movement) => (
            <Card key={movement.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getMovementIcon(movement.movementType)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold">{movement.inventoryItem.name}</h3>
                        {getMovementBadge(movement.movementType)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        SKU: {movement.inventoryItem.sku}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <Label className="text-xs font-medium">Quantity</Label>
                          <p className={`font-medium ${
                            movement.movementType === 'IN' ? 'text-green-600' : 
                            movement.movementType === 'OUT' ? 'text-red-600' : 
                            'text-blue-600'
                          }`}>
                            {movement.movementType === 'OUT' ? '-' : '+'}{movement.quantity}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs font-medium">Previous Stock</Label>
                          <p>{movement.previousStock}</p>
                        </div>
                        <div>
                          <Label className="text-xs font-medium">New Stock</Label>
                          <p className="font-medium">{movement.newStock}</p>
                        </div>
                      </div>
                      {movement.notes && (
                        <div className="mt-2">
                          <Label className="text-xs font-medium">Notes</Label>
                          <p className="text-sm text-muted-foreground">{movement.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {formatDate(movement.createdAt)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}