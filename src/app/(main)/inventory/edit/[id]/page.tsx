"use client";

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
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
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { calculateMargin, calculatePrice } from "@/lib/client-utils"

interface Product {
  id: string
  name: string
  description?: string | null
  price: number
  margin: number
  categoryId?: string
  sku: string
  cost?: number
}

interface Category {
  id: string
  name: string
}

export default function EditProductPage({ params: pageParams }: { params: { id: string } }) {
  const router = useRouter()
  const params = useParams() // Get params from hook
  const [loading, setLoading] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const productIdRef = useRef<string | null>(null)
  const [cost, setCost] = useState("")
  const [price, setPrice] = useState("")
  const [margin, setMargin] = useState("")
  const [originalCost, setOriginalCost] = useState("")
  const [originalPrice, setOriginalPrice] = useState("")
  const [originalMargin, setOriginalMargin] = useState("")
  const [changeReason, setChangeReason] = useState("")
  const [financialsChanged, setFinancialsChanged] = useState(false)
  
  // First useEffect to safely extract the ID using useParams hook
  useEffect(() => {
    // Get ID from URL params using the useParams hook
    const id = params.id as string
    productIdRef.current = id
  }, [params])
  
  // Second useEffect to fetch data once we have the ID
  useEffect(() => {
    // Don't proceed if we don't have a valid ID
    if (!productIdRef.current) return
    
    // Load product and categories data
    const loadData = async () => {
      try {
        // Fetch product data and categories in parallel using API routes instead of direct service calls
        const fetchProduct = fetch(`/api/products/${productIdRef.current}`).then(res => {
          if (!res.ok) {
            throw new Error('Failed to fetch product data');
          }
          return res.json();
        });
        
        const fetchCategories = fetch('/api/categories').then(res => {
          if (!res.ok) {
            throw new Error('Failed to fetch categories');
          }
          return res.json();
        });

        const [productData, categoriesData] = await Promise.all([
          fetchProduct,
          fetchCategories
        ])
        
        // Ensure product data matches our interface
        if (productData) {
          setProduct({
            id: productData.id,
            name: productData.name,
            description: productData.description,
            price: Number(productData.price),
            margin: Number(productData.margin),
            categoryId: productData.categoryId || undefined,
            sku: productData.sku,
            cost: productData.cost
          })
          
          // Initialize the form state variables
          const costStr = productData.cost ? productData.cost.toString() : "0";
          const priceStr = productData.price ? productData.price.toString() : "0";
          const marginStr = productData.margin ? productData.margin.toString() : "0";
          
          setCost(costStr);
          setPrice(priceStr);
          setMargin(marginStr);
          
          // Store original values for comparison
          setOriginalCost(costStr);
          setOriginalPrice(priceStr);
          setOriginalMargin(marginStr);
        }
        
        setCategories(categoriesData)
      } catch (error) {
        console.error("Failed to load data:", error)
        // Handle error appropriately
      }
    }
    
    loadData()
  }, [productIdRef.current])

  // Check if financial values have changed
  useEffect(() => {
    if (originalCost && originalPrice && originalMargin) {
      const costChanged = cost !== originalCost;
      const priceChanged = price !== originalPrice;
      const marginChanged = margin !== originalMargin;
      
      setFinancialsChanged(costChanged || priceChanged || marginChanged);
    }
  }, [cost, price, margin, originalCost, originalPrice, originalMargin]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!productIdRef.current || !product) {
      console.error("Missing product ID or product data")
      return
    }
    
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const productData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      price: parseFloat(formData.get("price") as string),
      margin: parseFloat(formData.get("margin") as string),
      categoryId: formData.get("category") as string,
      sku: formData.get("sku") as string || product.sku,
    }

    try {
      // Update basic product data
      const response = await fetch(`/api/products/${productIdRef.current}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error updating product');
      }
      
      // If financials were changed, update them separately to record history
      if (financialsChanged) {
        const financialsData = {
          price: parseFloat(price),
          cost: parseFloat(cost),
          margin: parseFloat(margin),
          changeReason: changeReason || "Updated price/cost"
        };
        
        const financialsResponse = await fetch(`/api/inventory/${productIdRef.current}/financials`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(financialsData)
        });
        
        if (!financialsResponse.ok) {
          const errorData = await financialsResponse.json();
          throw new Error(errorData.message || 'Error updating financials');
        }
      }
      
      router.push("/inventory?tab=products")
      router.refresh()
    } catch (error) {
      console.error("Failed to update product:", error)
      // Here you would typically show an error message to the user
    } finally {
      setLoading(false)
    }
  }

  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCost = e.target.value;
    setCost(newCost);
    
    if (newCost && price) {
      const costVal = parseFloat(newCost);
      const priceVal = parseFloat(price);
      const newMargin = calculateMargin(costVal, priceVal);
      console.log('Calculated margin (edit):', newMargin, 'from cost:', costVal, 'price:', priceVal);
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
      console.log('Calculated margin (edit):', newMargin, 'from cost:', costVal, 'price:', priceVal);
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
      console.log('Calculated price (edit):', newPrice, 'from cost:', costVal, 'margin:', marginVal);
      setPrice(newPrice.toFixed(2));
    }
  };

  if (!product) {
    return (
      <div>
        <Card>
          <CardContent className="py-10">
            <div className="text-center text-muted-foreground">
              Cargando datos del producto...
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { title: "Inventario", href: "/inventory" },
          { title: "Editar Producto" }
        ]}
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Editar Producto</CardTitle>
          <CardDescription>
            Actualizar información del producto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Producto</Label>
              <Input
                id="name"
                name="name"
                defaultValue={product.name}
                placeholder="Ingrese nombre del producto"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                name="sku"
                defaultValue={product.sku}
                placeholder="Ingrese SKU del producto"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={product.description || ""}
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
                  value={cost}
                  onChange={handleCostChange}
                  placeholder="0.00"
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
                  value={price}
                  onChange={handlePriceChange}
                  placeholder="0.00"
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
                  value={margin}
                  onChange={handleMarginChange}
                  placeholder="0"
                  required
                />
              </div>
            </div>
            
            {/* Reason field that appears when financial values change */}
            {financialsChanged && (
              <div className="space-y-2">
                <Label htmlFor="changeReason">Razón del Cambio de Precio/Costo</Label>
                <Textarea
                  id="changeReason"
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="Indique el motivo del cambio de precio o costo (ej: temporada, promoción, cambio de proveedor)"
                  className="min-h-[80px]"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select name="category" defaultValue={product.categoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/inventory")}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 