"use client"

import { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  inventory: {
    quantity: number;
  };
}

interface ProductSearchProps {
  onSelect: (product: Product) => void;
  onSubmit?: () => void;
}

export default function ProductSearch({ onSelect, onSubmit }: ProductSearchProps) {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLUListElement>(null);
  const { toast } = useToast();

  const searchProducts = useDebounce(async (term: string) => {
    if (!term.trim()) {
      setProducts([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/products/search?query=${encodeURIComponent(term)}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data.products);
      // Reset selected index when new results arrive
      setSelectedIndex(-1);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to search products. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, 300);

  useEffect(() => {
    searchProducts(query);
  }, [query]);

  const handleSelect = useCallback((product: Product) => {
    onSelect(product);
    setQuery('');
    setShowResults(false);
    setSelectedIndex(-1);
    // Focus back on search input after selection
    searchInputRef.current?.focus();
  }, [onSelect]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || loading || !products.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < products.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelect(products[selectedIndex]);
        } else if (onSubmit && !showResults) {
          onSubmit();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowResults(false);
        setSelectedIndex(-1);
        break;
      case 'Tab':
        if (showResults) {
          e.preventDefault();
          if (e.shiftKey) {
            setSelectedIndex(prev => prev > 0 ? prev - 1 : products.length - 1);
          } else {
            setSelectedIndex(prev => prev < products.length - 1 ? prev + 1 : 0);
          }
        }
        break;
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [selectedIndex]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input
          ref={searchInputRef}
          type="search"
          placeholder="Search products by name or SKU... (↑↓ to navigate, Enter to select)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
          onKeyDown={handleKeyDown}
          className="pl-9 pr-4"
          autoComplete="off"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
            onClick={() => {
              setQuery('');
              searchInputRef.current?.focus();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showResults && (query || loading) && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border max-h-96 overflow-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : products.length > 0 ? (
            <ul ref={resultsRef} className="py-2">
              {products.map((product, index) => (
                <li
                  key={product.id}
                  className={`px-4 py-2 cursor-pointer transition-colors ${
                    index === selectedIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => handleSelect(product)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className={`text-sm ${
                        index === selectedIndex ? 'text-primary-foreground/70' : 'text-gray-500'
                      }`}>{product.sku}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(product.price)}</div>
                      <div className={`text-sm ${
                        product.inventory.quantity > 0 
                          ? index === selectedIndex ? 'text-primary-foreground/70' : 'text-green-600'
                          : index === selectedIndex ? 'text-primary-foreground/70' : 'text-red-600'
                      }`}>
                        {product.inventory.quantity > 0 ? `${product.inventory.quantity} in stock` : 'Out of stock'}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-gray-500">
              No products found
            </div>
          )}
        </div>
      )}
    </div>
  );
} 