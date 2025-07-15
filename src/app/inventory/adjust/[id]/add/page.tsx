"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus } from "lucide-react";
import { useDebugInventoryAdjust } from "@/hooks/useDebugInventoryAdjust";
import { DebugOverlay } from "@/components/debug/DebugOverlay";

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minStockLevel: number;
  unitCost: number;
  unitPrice: number;
  category?: {
    id: string;
    name: string;
  };
  location?: {
    id: string;
    name: string;
  };
}

export default function AddStockPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const inventoryId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [inventoryItem, setInventoryItem] = useState<InventoryItem | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");

  // Debug system integration
  const { debugLogs, isDebugVisible, setIsDebugVisible, addLog, debugButtonClick } =
    useDebugInventoryAdjust(inventoryId, 'add');

  useEffect(() => {
    fetchInventoryItem();
  }, [inventoryId]);

  const fetchInventoryItem = async () => {
    try {
      addLog('state', `Starting fetchInventoryItem for ID: ${inventoryId}`);
      setLoading(true);
      const response = await fetch(`/api/inventory/${inventoryId}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.success && data.item) {
        setInventoryItem(data.item);
        addLog('state', 'Inventory item loaded successfully', data.item);
      } else {
        throw new Error('Item not found');
      }
    } catch (error) {
      addLog('error', 'Error fetching inventory item', error);
      console.error('Error fetching inventory item:', error);
      toast({
        title: 'Error',
        description: 'Failed to load inventory item',
        variant: 'destructive'
      });
      router.push('/inventory');
    } finally {
      setLoading(false);
      addLog('state', 'Loading state set to false');
    }
  };

  const handleAddStock = async () => {
    addLog('event', `handleAddStock called with quantity: ${quantity}, notes: ${notes}`);
    
    if (quantity <= 0) {
      addLog('error', 'Invalid quantity validation failed', { quantity });
      toast({
        title: 'Error',
        description: 'Please enter a valid quantity',
        variant: 'destructive'
      });
      return;
    }

    try {
      addLog('state', 'Setting submitting to true');
      setSubmitting(true);
      
      const requestBody = { quantity, notes };
      addLog('network', 'Preparing add-stock request', requestBody);
      
      const response = await fetch(`/api/inventory/${inventoryId}/add-stock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      addLog('network', `Add-stock response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorData = await response.json();
        addLog('error', 'Add-stock API error', errorData);
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      addLog('network', 'Add-stock success response', data);
      
      toast({
        title: 'Success',
        description: `Added ${quantity} units to ${inventoryItem?.name}`,
      });

      addLog('event', 'Navigating back to inventory');
      router.push('/inventory');
    } catch (error: any) {
      addLog('error', 'handleAddStock error', error);
      console.error('Error adding stock:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add stock',
        variant: 'destructive'
      });
    } finally {
      addLog('state', 'Setting submitting to false');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading inventory item...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!inventoryItem) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Inventory item not found</p>
              <Button onClick={() => router.push('/inventory')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Inventory
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 min-h-screen pb-20">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push('/inventory')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Inventory
        </Button>
        <h1 className="text-2xl font-bold">Add Stock</h1>
        <p className="text-muted-foreground">
          Add inventory to {inventoryItem.name}
        </p>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Stock - {inventoryItem.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pb-6">
          {/* Current Item Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <Label className="text-sm font-medium">Current Stock</Label>
              <p className="text-2xl font-bold text-blue-600">{inventoryItem.currentStock || 0}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Min Stock Level</Label>
              <p className="text-lg font-medium">{inventoryItem.minStockLevel}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">SKU</Label>
              <p className="text-sm">{inventoryItem.sku}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Category</Label>
              <p className="text-sm">{inventoryItem.category?.name || 'Sin categoría'}</p>
            </div>
          </div>

          {/* Add Stock Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="quantity">Quantity to Add *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                placeholder="Enter quantity to add"
                disabled={submitting}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason for adding stock..."
                disabled={submitting}
              />
            </div>

            {quantity > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>New Stock Level:</strong> {(inventoryItem.currentStock || 0) + quantity} units
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Fixed Bottom Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 safe-area-pb">
        <div className="container mx-auto flex gap-2">
          <Button
            onClick={debugButtonClick(handleAddStock, 'Add Stock Button')}
            disabled={submitting || quantity <= 0}
            className="flex-1"
            size="lg"
          >
            {submitting ? 'Adding...' : `Add ${quantity} Units`}
          </Button>
          <Button
            variant="outline"
            onClick={debugButtonClick(() => router.push('/inventory'), 'Cancel Button')}
            disabled={submitting}
            size="lg"
          >
            Cancel
          </Button>
        </div>
      </div>

      {/* Debug Overlay */}
      <DebugOverlay
        logs={debugLogs}
        isVisible={isDebugVisible}
        onToggle={() => setIsDebugVisible(!isDebugVisible)}
      />
    </div>
  );
}