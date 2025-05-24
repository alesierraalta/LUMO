"use client"

import Image from 'next/image';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ShoppingCart, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  imageUrl?: string | null;
  quantity: number;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [loading, setLoading] = useState(false);

  const handleMarkAsSold = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark product as sold');
      }

      // Refresh the page to update the inventory
      window.location.reload();
    } catch (error) {
      console.error('Error marking product as sold:', error);
      alert('Failed to mark product as sold');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 flex flex-col">
      {/* Product Image */}
      <div className="relative h-48 mb-4">
        <Image
          src={product.imageUrl || '/placeholder-product.png'}
          alt={product.name}
          fill
          className="object-cover rounded"
        />
      </div>

      {/* Product Info */}
      <div className="flex-grow">
        <Link href={`/tienda/products/${product.id}`}>
          <h3 className="font-semibold text-lg mb-2 hover:text-primary">
            {product.name}
          </h3>
        </Link>
        <p className="text-gray-600 text-sm mb-2">{product.sku}</p>
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-bold">
            {formatCurrency(product.price)}
          </span>
          <Badge variant={product.quantity > 0 ? "success" : "destructive"}>
            {product.quantity > 0 ? 'In Stock' : 'Out of Stock'}
          </Badge>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button 
          className="flex-1"
          disabled={product.quantity === 0}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Add to Cart
        </Button>
        <Button
          variant="secondary"
          className="flex-1"
          disabled={product.quantity === 0 || loading}
          onClick={handleMarkAsSold}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          ) : (
            <>
              <DollarSign className="w-4 h-4 mr-2" />
              Mark as Sold
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 