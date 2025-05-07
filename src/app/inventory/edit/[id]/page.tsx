"use client"

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
import { updateProduct } from "@/services/productService"
import { Breadcrumb } from "@/components/ui/breadcrumb"

interface Product {
  id: string
  name: string
  description?: string | null
  price: number
  margin: number
  categoryId?: string
  sku: string
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
            sku: productData.sku
          })
        }
        
        setCategories(categoriesData)
      } catch (error) {
        console.error("Failed to load data:", error)
        // Handle error appropriately
      }
    }
    
    loadData()
  }, [productIdRef.current])

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
      // Update using the API route instead of direct service call
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
      
      router.push("/inventory?tab=products")
      router.refresh()
    } catch (error) {
      console.error("Failed to update product:", error)
      // Here you would typically show an error message to the user
    } finally {
      setLoading(false)
    }
  }

  if (!product) {
    return (
      <div className="container max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="py-10">
            <div className="text-center text-muted-foreground">
              Loading product data...
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto space-y-6 p-6">
      <Breadcrumb
        items={[
          { title: "Inventory", href: "/inventory" },
          { title: "Edit Product" }
        ]}
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Edit Product</CardTitle>
          <CardDescription>
            Update product information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={product.name}
                placeholder="Enter product name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                name="sku"
                defaultValue={product.sku}
                placeholder="Enter product SKU"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={product.description || ""}
                placeholder="Enter product description"
                className="min-h-[100px]"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={product.price}
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="margin">Margin (%)</Label>
                <Input
                  id="margin"
                  name="margin"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={product.margin}
                  placeholder="0"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select name="category" defaultValue={product.categoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
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
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/inventory?tab=products")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 