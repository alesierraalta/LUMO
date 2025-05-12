"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createProductApi, ProductData, calculateMargin, calculatePrice } from "@/lib/client-utils"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function AddProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [error, setError] = useState("")
  const [cost, setCost] = useState("")
  const [price, setPrice] = useState("")
  const [margin, setMargin] = useState("")

  // Load categories on mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    }
    fetchCategories();
  }, [])

  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCost = e.target.value;
    setCost(newCost);
    
    if (newCost && price) {
      const costVal = parseFloat(newCost);
      const priceVal = parseFloat(price);
      const newMargin = calculateMargin(costVal, priceVal);
      console.log('Calculated margin:', newMargin, 'from cost:', costVal, 'price:', priceVal);
      setMargin(newMargin.toFixed(2));
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrice = e.target.value;
    setPrice(newPrice);
    
    if (cost && newPrice) {
      const costVal = parseFloat(cost);
      const priceVal = parseFloat(newPrice);
      const newMargin = calculateMargin(costVal, priceVal);
      console.log('Calculated margin:', newMargin, 'from cost:', costVal, 'price:', priceVal);
      setMargin(newMargin.toFixed(2));
    }
  };

  const handleMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMargin = e.target.value;
    setMargin(newMargin);
    
    if (cost && newMargin) {
      const costVal = parseFloat(cost);
      const marginVal = parseFloat(newMargin);
      const newPrice = calculatePrice(costVal, marginVal);
      console.log('Calculated price:', newPrice, 'from cost:', costVal, 'margin:', marginVal);
      setPrice(newPrice.toFixed(2));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("") // Clear previous errors

    const formData = new FormData(e.currentTarget)
    const categoryValue = formData.get("category") as string
    
    const productData: ProductData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      price: parseFloat(formData.get("price") as string),
      cost: parseFloat(formData.get("cost") as string),
      margin: parseFloat(formData.get("margin") as string),
      categoryId: categoryValue && categoryValue !== "uncategorized" ? categoryValue : undefined,
      sku: formData.get("sku") as string,
      quantity: parseInt(formData.get("quantity") as string) || 0,
      minStockLevel: parseInt(formData.get("minStockLevel") as string) || 5,
      location: (formData.get("location") as string) || undefined
    }

    try {
      await createProductApi(productData)
      router.push("/inventory?tab=products")
      router.refresh()
    } catch (error: any) {
      console.error("Failed to create product:", error)
      // Extract error message from the error object
      const errorMessage = error.message || "Error al crear el producto"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { title: "Inventario", href: "/inventory" },
          { title: "Añadir Producto" }
        ]}
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Añadir Nuevo Producto</CardTitle>
          <CardDescription>
            Crear un nuevo producto en su inventario
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Producto</Label>
              <Input
                id="name"
                name="name"
                placeholder="Ingrese nombre del producto"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                name="sku"
                placeholder="Ingrese SKU del producto"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Ingrese descripción del producto"
                className="min-h-[100px]"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost">Costo</Label>
                <Input
                  id="cost"
                  name="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={cost}
                  onChange={handleCostChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">Precio</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={price}
                  onChange={handlePriceChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="margin">Margen (%)</Label>
                <Input
                  id="margin"
                  name="margin"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={margin}
                  onChange={handleMarginChange}
                  required
                />
              </div>
            </div>
            
            <div className="mt-1 text-xs text-muted-foreground">
              El margen se calcula como porcentaje sobre el costo: (Precio-Costo)/Costo × 100.
              <br />
              Ejemplo: Precio=100, Costo=50 → Margen=100%
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select name="category">
                <SelectTrigger id="category">
                  <SelectValue placeholder="Seleccione una categoría (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uncategorized">Sin categoría</SelectItem>
                  {categories.map((category: any) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-medium mb-4">Información de Inventario</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Cantidad Inicial</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="0"
                    placeholder="0"
                    defaultValue="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="minStockLevel">Nivel Mínimo de Stock</Label>
                  <Input
                    id="minStockLevel"
                    name="minStockLevel"
                    type="number"
                    min="0"
                    placeholder="5"
                    defaultValue="5"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Ubicación</Label>
                  <Input
                    id="location"
                    name="location"
                    placeholder="Ubicación (opcional)"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={loading}
              >
                {loading ? "Guardando..." : "Guardar Producto"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 