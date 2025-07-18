'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Save, Package, AlertCircle } from 'lucide-react';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { apiGet, apiPut } from '@/lib/api-client';

interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  barcode: string | null;
  category_id: string | null;
  unit: string;
  cost_price: number;
  selling_price: number;
  min_stock: number;
  max_stock: number | null;
  current_stock: number;
  location: string | null;
  supplier_id: string | null;
  is_active: boolean;
  categories?: {
    id: string;
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
}

const breadcrumbItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Inventario', href: '/inventory' },
  { label: 'Editar Producto', href: '#', active: true },
];

const units = [
  'unidad', 'kg', 'g', 'lb', 'oz', 'l', 'ml', 'gal', 'm', 'cm', 'mm', 'ft', 'in', 'pcs', 'box', 'pack'
];

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    barcode: '',
    category_id: '',
    unit: 'unidad',
    cost_price: '',
    selling_price: '',
    min_stock: '',
    max_stock: '',
    location: '',
    is_active: true
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch product data
        const productResponse = await apiGet(`/api/products/${productId}`);
        if (productResponse.error) {
          toast.error('Error al cargar el producto');
          router.push('/inventory');
          return;
        }

        const productData = productResponse.data;
        setProduct(productData);

        // Set form data
        setFormData({
          name: productData.name || '',
          description: productData.description || '',
          sku: productData.sku || '',
          barcode: productData.barcode || '',
          category_id: productData.category_id || '',
          unit: productData.unit || 'unidad',
          cost_price: productData.cost_price?.toString() || '',
          selling_price: productData.selling_price?.toString() || '',
          min_stock: productData.min_stock?.toString() || '',
          max_stock: productData.max_stock?.toString() || '',
          location: productData.location || '',
          is_active: productData.is_active !== false
        });

        // Fetch categories
        const categoriesResponse = await apiGet('/api/categories');
        if (!categoriesResponse.error && categoriesResponse.data) {
          setCategories(categoriesResponse.data);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Error al cargar los datos');
        router.push('/inventory');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchData();
    }
  }, [productId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('El nombre del producto es requerido');
      return;
    }

    if (!formData.sku.trim()) {
      toast.error('El SKU es requerido');
      return;
    }

    if (!formData.cost_price || parseFloat(formData.cost_price) < 0) {
      toast.error('El precio de costo debe ser un número válido');
      return;
    }

    if (!formData.selling_price || parseFloat(formData.selling_price) < 0) {
      toast.error('El precio de venta debe ser un número válido');
      return;
    }

    if (!formData.min_stock || parseInt(formData.min_stock) < 0) {
      toast.error('El stock mínimo debe ser un número válido');
      return;
    }

    setSubmitting(true);

    try {
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        sku: formData.sku.trim(),
        barcode: formData.barcode.trim() || null,
        category_id: formData.category_id || null,
        unit: formData.unit,
        cost_price: parseFloat(formData.cost_price),
        selling_price: parseFloat(formData.selling_price),
        min_stock: parseInt(formData.min_stock),
        max_stock: formData.max_stock ? parseInt(formData.max_stock) : null,
        location: formData.location.trim() || null,
        is_active: formData.is_active
      };

      const response = await apiPut(`/api/products/${productId}`, updateData);

      if (response.error) {
        toast.error(response.error);
        return;
      }

      toast.success('Producto actualizado exitosamente');
      router.push('/inventory');
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Error al actualizar el producto. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Producto no encontrado</h2>
          <p className="mt-2 text-gray-600">El producto que buscas no existe o no tienes permisos para editarlo.</p>
          <Button onClick={() => router.push('/inventory')} className="mt-4">
            Volver al Inventario
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <Breadcrumbs items={breadcrumbItems} />
      </nav>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Package className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Producto</h1>
            <p className="text-gray-600">Actualizar información del producto</p>
          </div>
        </div>
      </div>

      {/* Current Stock Info */}
      <div className="mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Stock Actual</p>
                <p className="text-2xl font-bold text-blue-600">
                  {product.current_stock} {product.unit}
                </p>
              </div>
              {product.current_stock <= product.min_stock && (
                <div className="flex items-center gap-2 text-yellow-600">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Stock Bajo</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Producto</CardTitle>
          <CardDescription>
            Actualiza los datos del producto. Los campos marcados con * son obligatorios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">
                  Nombre del Producto <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Nombre del producto"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="sku">
                  SKU <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  placeholder="Código único del producto"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descripción detallada del producto"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="barcode">Código de Barras</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => handleInputChange('barcode', e.target.value)}
                  placeholder="Código de barras"
                />
              </div>
              
              <div>
                <Label htmlFor="category">Categoría</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => handleInputChange('category_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin categoría</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pricing and Stock */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="unit">
                  Unidad de Medida <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => handleInputChange('unit', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="cost_price">
                  Precio de Costo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cost_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cost_price}
                  onChange={(e) => handleInputChange('cost_price', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="selling_price">
                  Precio de Venta <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="selling_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.selling_price}
                  onChange={(e) => handleInputChange('selling_price', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="min_stock">
                  Stock Mínimo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="min_stock"
                  type="number"
                  min="0"
                  value={formData.min_stock}
                  onChange={(e) => handleInputChange('min_stock', e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="max_stock">Stock Máximo</Label>
                <Input
                  id="max_stock"
                  type="number"
                  min="0"
                  value={formData.max_stock}
                  onChange={(e) => handleInputChange('max_stock', e.target.value)}
                  placeholder="Opcional"
                />
              </div>
              
              <div>
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Ej: Almacén A, Estante 1"
                />
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="is_active">Producto activo</Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Guardar Cambios
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={submitting}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}