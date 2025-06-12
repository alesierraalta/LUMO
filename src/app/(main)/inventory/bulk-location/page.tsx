"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MapPin, Package, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { locationsApi } from "@/lib/api-client";

interface Product {
  id: string;
  name: string;
  sku: string;
  locationId?: string;
  location_name?: string;
}

interface Location {
  id: string;
  name: string;
  description?: string;
}

export default function BulkLocationPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, locationsResponse] = await Promise.all([
        fetch('/api/products'),
        locationsApi.getAll()
      ]);

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData.products || []);
      }

      if (locationsResponse.data) {
        setLocations(locationsResponse.data);
      } else if (locationsResponse.error) {
        console.error('Error fetching locations:', locationsResponse.error);
        toast.error('Error al cargar las ubicaciones');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar los datos');
    }
  };

  const handleProductSelection = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  const handleBulkAssign = async () => {
    if (!selectedLocation || selectedProducts.length === 0) {
      toast.error('Selecciona una ubicación y al menos un producto');
      return;
    }

    setLoading(true);
    try {
      const promises = selectedProducts.map(productId =>
        fetch(`/api/products/${productId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locationId: selectedLocation })
        })
      );

      await Promise.all(promises);
      
      toast.success(`${selectedProducts.length} productos asignados correctamente`);
      setSelectedProducts([]);
      await fetchData(); // Recargar datos
    } catch (error) {
      console.error('Error assigning locations:', error);
      toast.error('Error al asignar ubicaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFix = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/fix-locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to auto-fix locations');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message);
        await fetchData(); // Recargar datos
      } else {
        toast.error(result.error || 'Error en la migración automática');
      }
    } catch (error) {
      console.error('Error auto-fixing locations:', error);
      toast.error('Error al ejecutar la migración automática');
    } finally {
      setLoading(false);
    }
  };

  const productsWithoutLocation = products.filter(p => !p.locationId);
  const selectedLocationName = locations.find(l => l.id === selectedLocation)?.name;

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gestión Masiva de Ubicaciones</h1>
            <p className="text-muted-foreground">Asigna ubicaciones a múltiples productos a la vez</p>
          </div>
        </div>
        
        {productsWithoutLocation.length > 0 && (
          <Button 
            onClick={handleAutoFix}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? "Procesando..." : "🔧 Auto-Fix Ubicaciones"}
          </Button>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sin Ubicación</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{productsWithoutLocation.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ubicaciones Disponibles</CardTitle>
            <MapPin className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{locations.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Panel de asignación */}
      <Card>
        <CardHeader>
          <CardTitle>Asignación Masiva</CardTitle>
          <CardDescription>
            Selecciona una ubicación y los productos para asignar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una ubicación" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-green-500" />
                        <span>{location.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={handleBulkAssign}
              disabled={!selectedLocation || selectedProducts.length === 0 || loading}
              className="min-w-[200px]"
            >
              {loading ? "Asignando..." : `Asignar a ${selectedProducts.length} productos`}
            </Button>
          </div>

          {selectedLocation && selectedProducts.length > 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">
                  {selectedProducts.length} productos serán asignados a "{selectedLocationName}"
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla de productos */}
      <Card>
        <CardHeader>
          <CardTitle>Productos sin Ubicación</CardTitle>
          <CardDescription>
            Selecciona los productos que deseas asignar a una ubicación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProducts(productsWithoutLocation.map(p => p.id));
                      } else {
                        setSelectedProducts([]);
                      }
                    }}
                    checked={selectedProducts.length === productsWithoutLocation.length && productsWithoutLocation.length > 0}
                  />
                </TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsWithoutLocation.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={(e) => handleProductSelection(product.id, e.target.checked)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                      Sin ubicación
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {productsWithoutLocation.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex flex-col items-center space-y-2">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                      <span className="text-muted-foreground">
                        ¡Excelente! Todos los productos tienen ubicación asignada.
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 