"use client"

import { useRouter, useSearchParams } from 'next/navigation';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTransition } from 'react';
import { useDebounce } from '@/hooks/use-debounce';

async function getCategories() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }

  return response.json();
}

export default async function ProductFilters() {
  const categories = await getCategories();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const updateFilters = useDebounce((updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Update or remove each parameter
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    
    // Reset to first page when filtering
    params.delete('page');

    startTransition(() => {
      router.push(`/tienda?${params.toString()}`);
    });
  }, 300);

  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible className="w-full">
        {/* Categories */}
        <AccordionItem value="categories">
          <AccordionTrigger>Categories</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {categories.map((category: { id: string; name: string }) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={category.id}
                    checked={searchParams.get('category') === category.id}
                    onCheckedChange={(checked: boolean | 'indeterminate') => {
                      updateFilters({
                        category: checked === true ? category.id : undefined,
                      });
                    }}
                  />
                  <Label htmlFor={category.id}>{category.name}</Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Price Range */}
        <AccordionItem value="price">
          <AccordionTrigger>Price Range</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="minPrice">Min Price</Label>
                <Input
                  id="minPrice"
                  type="number"
                  placeholder="0"
                  defaultValue={searchParams.get('minPrice') || ''}
                  onChange={(e) =>
                    updateFilters({
                      minPrice: e.target.value || undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxPrice">Max Price</Label>
                <Input
                  id="maxPrice"
                  type="number"
                  placeholder="1000"
                  defaultValue={searchParams.get('maxPrice') || ''}
                  onChange={(e) =>
                    updateFilters({
                      maxPrice: e.target.value || undefined,
                    })
                  }
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Stock Status */}
        <AccordionItem value="stock">
          <AccordionTrigger>Stock Status</AccordionTrigger>
          <AccordionContent>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="inStock"
                checked={searchParams.get('inStock') === 'true'}
                onCheckedChange={(checked: boolean | 'indeterminate') => {
                  updateFilters({
                    inStock: checked === true ? 'true' : undefined,
                  });
                }}
              />
              <Label htmlFor="inStock">In Stock Only</Label>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {isPending && (
        <div className="flex justify-center py-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
} 