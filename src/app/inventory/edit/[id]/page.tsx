"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Package } from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  description?: string;
  currentStock: number;
  minStockLevel: number;
  unitCost: number;
  unitPrice: number;
  categoryId?: string;
  locationId?: string;
  category?: {
    id: string;
    name: string;
  };
  location?: {
    id: string;
    name: string;
  };
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const productId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [product, setProduct] = useState<InventoryItem | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    currentStock: 0,
    minStockLevel: 0,
    unitCost: 0,
    unitPrice: 0,
    categoryId: "",
    locationId: "",
    isActive: true
  });

  useEffect(() => {
    fetchData();
  }, [productId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch product, categories, and locations in parallel
      const [productRes, categoriesRes, locationsRes] = await Promise.all([
        fetch(`/api/inventory/${productId}`),
        fetch('/api/categories'),
        fetch('/api/locations')
      ]);

      // Handle product data
      if (!productRes.ok) {
        throw new Error(`Error ${productRes.status}: ${productRes.statusText}`);
      }
      
      const productData = await productRes.json();
      if (productData.success && productData.item) {
        const item = productData.item;
        setProduct(item);
        setFormData({
          name: item.name || "",
          sku: item.sku || "",
          description: item.description || "",
          currentStock: item.currentStock || 0,
          minStockLevel: item.minStockLevel || 0,
          unitCost: item.unitCost || 0,
          unitPrice: item.unitPrice || 0,
          categoryId: item.categoryId || "",
          locationId: item.locationId || "",
          isActive: item.isActive ?? true
        });
      } else {
        throw new Error('Product not found');
      }

      // Handle categories data
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        if (categoriesData.success) {
          setCategories(categoriesData.categories || []);
        }
      }

      // Handle locations data
      if (locationsRes.ok) {
        const locationsData = await locationsRes.json();
        if (locationsData.success) {
          setLocations(locationsData.locations || []);
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load product data',
        variant: 'destructive'
      });
      router.push('/inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    // Basic validation
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Product name is required',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.sku.trim()) {
      toast({
        title: 'Error',
        description: 'SKU is required',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/inventory/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          sku: formData.sku,
          description: formData.description,
          currentStock: formData.currentStock,
          minStockLevel: formData.minStockLevel,
          unitCost: formData.unitCost,
          unitPrice: formData.unitPrice,
          categoryId: formData.categoryId || null,
          locationId: formData.locationId || null,
          isActive: formData.isActive
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      toast({
        title: 'Success',
        description: `Product "${formData.name}" updated successfully`,
      });

      router.push('/inventory');
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update product',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Product not found</p>
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
        <h1 className="text-2xl font-bold">Edit Product</h1>
        <p className="text-muted-foreground">
          Update product information and inventory details
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Edit Product - {product.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter product name"
                disabled={submitting}
              />
            </div>
            <div>
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleInputChange('sku', e.target.value)}
                placeholder="Enter SKU"
                disabled={submitting}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter product description"
              disabled={submitting}
            />
          </div>

          {/* Inventory Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="currentStock">Current Stock</Label>
              <Input
                id="currentStock"
                type="number"
                min="0"
                step="1"
                value={formData.currentStock}
                onChange={(e) => handleInputChange('currentStock', parseInt(e.target.value) || 0)}
                disabled={submitting}
              />
            </div>
            <div>
              <Label htmlFor="minStockLevel">Min Stock Level</Label>
              <Input
                id="minStockLevel"
                type="number"
                min="0"
                step="1"
                value={formData.minStockLevel}
                onChange={(e) => handleInputChange('minStockLevel', parseInt(e.target.value) || 0)}
                disabled={submitting}
              />
            </div>
          </div>

          {/* Pricing Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="unitCost">Unit Cost</Label>
              <Input
                id="unitCost"
                type="number"
                min="0"
                step="0.01"
                value={formData.unitCost}
                onChange={(e) => handleInputChange('unitCost', parseFloat(e.target.value) || 0)}
                disabled={submitting}
              />
            </div>
            <div>
              <Label htmlFor="unitPrice">Unit Price</Label>
              <Input
                id="unitPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) => handleInputChange('unitPrice', parseFloat(e.target.value) || 0)}
                disabled={submitting}
              />
            </div>
          </div>

          {/* Category and Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select 
                value={formData.categoryId} 
                onValueChange={(value) => handleInputChange('categoryId', value)}
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Select 
                value={formData.locationId} 
                onValueChange={(value) => handleInputChange('locationId', value)}
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Location</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Calculated Values */}
          {formData.unitCost > 0 && formData.unitPrice > 0 && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <h3 className="font-medium mb-2">Calculated Values</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <Label>Margin</Label>
                  <p className="font-medium">
                    ${(formData.unitPrice - formData.unitCost).toFixed(2)}
                  </p>
                </div>
                <div>
                  <Label>Margin %</Label>
                  <p className="font-medium">
                    {(((formData.unitPrice - formData.unitCost) / formData.unitCost) * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <Label>Stock Value</Label>
                  <p className="font-medium">
                    ${(formData.currentStock * formData.unitCost).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={handleSave} 
              disabled={submitting || !formData.name.trim() || !formData.sku.trim()}
              className="flex-1"
            >
              <Save className="mr-2 h-4 w-4" />
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/inventory')}
              disabled={submitting}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 