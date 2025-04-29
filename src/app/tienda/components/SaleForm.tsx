"use client"

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import ProductSearch from './ProductSearch';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  inventory: {
    quantity: number;
  };
}

export default function SaleForm() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleQuantityChange = (value: string) => {
    const newQuantity = parseInt(value, 10);
    if (isNaN(newQuantity) || newQuantity < 1) {
      setQuantity(1);
    } else if (selectedProduct && newQuantity > selectedProduct.inventory.quantity) {
      setQuantity(selectedProduct.inventory.quantity);
    } else {
      setQuantity(newQuantity);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setLoading(true);
    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: selectedProduct.id,
          quantity,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create sale');
      }

      toast({
        variant: "success",
        title: "Sale Completed",
        description: `Successfully sold ${quantity} units of ${selectedProduct.name}`,
      });

      // Reset form
      setSelectedProduct(null);
      setQuantity(1);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to complete the sale. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Product</Label>
        <ProductSearch onSelect={setSelectedProduct} />
      </div>

      {selectedProduct && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{selectedProduct.name}</h3>
              <p className="text-sm text-gray-500">{selectedProduct.sku}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedProduct(null)}
            >
              Remove
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                max={selectedProduct.inventory.quantity}
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-1">
                {selectedProduct.inventory.quantity} available
              </p>
            </div>
            <div>
              <Label>Total</Label>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(selectedProduct.price * quantity)}
              </p>
            </div>
          </div>
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={!selectedProduct || loading}
      >
        {loading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        ) : (
          'Complete Sale'
        )}
      </Button>
    </form>
  );
} 