'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Package } from 'lucide-react';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { apiGet, apiPost } from '@/lib/api-client';

interface Product {
  id: string;
  name: string;
  sku: string;
  current_stock: number;
  unit: string;
}

const breadcrumbItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Inventario', href: '/inventory' },
  { label: 'Ajustar Stock', href: '/inventory' },
  { label: 'Agregar Stock', href: '#', active: true },
];

export default function AddStockPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    quantity: '',
    reason: '',
    notes: ''
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await apiGet(`/api/products/${productId}`);
        if (response.error) {
          toast.error('Error al cargar el producto');
          router.push('/inventory');
          return;
        }
        setProduct(response.data);
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Error al cargar el producto');
        router.push('/inventory');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      toast.error('Por favor ingresa una cantidad válida');
      return;
    }

    if (!formData.reason.trim()) {
      toast.error('Por favor ingresa una razón para el ajuste');
      return;
    }

    setSubmitting(true);

    try {
      const response = await apiPost('/api/inventory/movements', {
        product_id: productId,
        movement_type: 'IN',
        quantity: parseFloat(formData.quantity),
        reason: formData.reason,
        notes: formData.notes || null,
        reference_type: 'ADJUSTMENT'
      });

      if (response.error) {
        toast.error(response.error);
        return;
      }

      toast.success(`Se agregaron ${formData.quantity} ${product?.unit || 'unidades'} al inventario`);
      router.push('/inventory');
    } catch (error) {
      console.error('Error adding stock:', error);
      toast.error('Error al agregar stock. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
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
          <p className="mt-2 text-gray-600">El producto que buscas no existe o no tienes permisos para verlo.</p>
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
          <div className="p-2 bg-green-100 rounded-lg">
            <Plus className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agregar Stock</h1>
            <p className="text-gray-600">Incrementar el inventario del producto</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Información del Producto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Nombre</Label>
                <p className="text-lg font-semibold">{product.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">SKU</Label>
                <p className="text-sm text-gray-900">{product.sku}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Stock Actual</Label>
                <p className="text-2xl font-bold text-blue-600">
                  {product.current_stock} {product.unit}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Stock Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Agregar Stock</CardTitle>
              <CardDescription>
                Completa la información para agregar stock al inventario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">
                      Cantidad a Agregar <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange('quantity', e.target.value)}
                      placeholder={`Cantidad en ${product.unit}`}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="reason">
                      Razón del Ajuste <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="reason"
                      value={formData.reason}
                      onChange={(e) => handleInputChange('reason', e.target.value)}
                      placeholder="Ej: Compra, Devolución, Corrección"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notas Adicionales</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Información adicional sobre el ajuste (opcional)"
                    rows={3}
                  />
                </div>

                {/* Preview */}
                {formData.quantity && parseFloat(formData.quantity) > 0 && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Vista Previa del Ajuste</h4>
                    <div className="text-sm text-green-700 space-y-1">
                      <p>Stock actual: <span className="font-medium">{product.current_stock} {product.unit}</span></p>
                      <p>Cantidad a agregar: <span className="font-medium">+{formData.quantity} {product.unit}</span></p>
                      <p>Stock después del ajuste: <span className="font-medium text-green-800">
                        {(product.current_stock + parseFloat(formData.quantity)).toFixed(2)} {product.unit}
                      </span></p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Agregar Stock
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
      </div>
    </div>
  );
}