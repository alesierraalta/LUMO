"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, Pencil, Trash2, Calculator } from "lucide-react"
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StockStatus } from "@/services/inventoryService"
import ProductFilters from "./product-filters"
import { SortOrder } from "@/services/productService"
import { calculateMargin } from "@/lib/client-utils"
import { getMarginCategory, getMarginColor, getMarginLabel } from "@/lib/margin-settings"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatCurrency } from "@/lib/utils"

enum LocalStockStatus {
  OUT_OF_STOCK = "OUT_OF_STOCK",
  LOW_STOCK = "LOW_STOCK",
  IN_STOCK = "IN_STOCK"
}

interface FilterState {
  searchTerm: string
  categoryId?: string
  minPrice?: number
  maxPrice?: number
  minMargin?: number
  maxMargin?: number
  inStock?: boolean
  sortBy?: string
  sortOrder?: SortOrder
}

interface ProductListProps {
  products: any[]
  categories?: any[]
  onProductDeleted?: (id: string) => void
}

export default function ProductList({ products, categories = [], onProductDeleted }: ProductListProps) {
  const [filteredProducts, setFilteredProducts] = useState(products)
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: ""
  })

  useEffect(() => {
    let result = [...products]

    if (filters.searchTerm) {
      const search = filters.searchTerm.toLowerCase()
      result = result.filter(product => 
        product.name.toLowerCase().includes(search) || 
        product.sku.toLowerCase().includes(search) ||
        (product.description && product.description.toLowerCase().includes(search))
      )
    }

    if (filters.categoryId) {
      result = result.filter(product => product.categoryId === filters.categoryId)
    }

    if (filters.minPrice !== undefined) {
      result = result.filter(product => Number(product.price) >= filters.minPrice!)
    }
    if (filters.maxPrice !== undefined) {
      result = result.filter(product => Number(product.price) <= filters.maxPrice!)
    }

    if (filters.minMargin !== undefined || filters.maxMargin !== undefined) {
      result = result.filter(product => {
        const margin = calculateMargin(Number(product.cost), Number(product.price))
        return (
          (filters.minMargin === undefined || margin >= filters.minMargin) &&
          (filters.maxMargin === undefined || margin <= filters.maxMargin)
        )
      })
    }

    if (filters.inStock !== undefined) {
      result = result.filter(product => filters.inStock ? product.quantity > 0 : true)
    }

    if (filters.sortBy) {
      result.sort((a, b) => {
        let valueA: any, valueB: any

        switch (filters.sortBy) {
          case "name":
            valueA = a.name.toLowerCase()
            valueB = b.name.toLowerCase()
            break
          case "price":
            valueA = Number(a.price)
            valueB = Number(b.price)
            break
          case "margin":
            valueA = calculateMargin(Number(a.cost), Number(a.price))
            valueB = calculateMargin(Number(b.cost), Number(b.price))
            break
          case "stock":
            valueA = Number(a.quantity)
            valueB = Number(b.quantity)
            break
          default:
            const sortKey = filters.sortBy as string;
            valueA = a[sortKey] !== undefined ? a[sortKey] : ''
            valueB = b[sortKey] !== undefined ? b[sortKey] : ''
        }

        return filters.sortOrder === "desc" 
          ? (valueA > valueB ? -1 : 1)
          : (valueA < valueB ? -1 : 1)
      })
    }

    setFilteredProducts(result)
  }, [products, filters])

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
  }

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("¿Está seguro que desea eliminar este producto? Esta acción no se puede deshacer.")) {
      return
    }

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete product")
      }

      if (onProductDeleted) {
        onProductDeleted(id)
      }
    } catch (error) {
      console.error("Error deleting product:", error)
      alert("No se pudo eliminar el producto. Por favor, inténtelo de nuevo.")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Products</CardTitle>
        <CardDescription>Manage your product catalog and view availability</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex justify-between gap-2">
          <div className="flex flex-1 items-center gap-2">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="pl-8"
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange({ searchTerm: e.target.value })}
                />
              </div>
            </form>
            <Button 
              variant="default" 
              size="sm"
              asChild
            >
              <Link href="/products/add">
                Add Product
              </Link>
            </Button>
          </div>
        </div>

        <ProductFilters 
          onFilterChange={handleFilterChange}
        />
        
        <div className="border rounded-md mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Margin</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    No products found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => {
                  const stockStatus = product.quantity 
                    ? product.quantity <= (product.minStockLevel || 0) 
                      ? LocalStockStatus.LOW_STOCK 
                      : LocalStockStatus.IN_STOCK 
                    : LocalStockStatus.OUT_OF_STOCK;
                  
                  const marginValue = Number(product.cost) > 0 
                    ? calculateMargin(Number(product.cost), Number(product.price))
                    : Number(product.margin);
                  
                  const marginCategory = getMarginCategory(marginValue);
                  const marginColor = getMarginColor(marginValue);
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="font-medium">{product.name}</div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                      <TableCell>
                        {product.category ? (
                          <Badge variant="outline">{product.category.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">None</span>
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(product.price)}</TableCell>
                      <TableCell>{formatCurrency(product.cost)}</TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1">
                                <span 
                                  className="px-2 py-1 rounded-full text-xs"
                                  style={{ backgroundColor: `${marginColor}40`, color: marginColor }}
                                >
                                  {marginValue.toFixed(2)}%
                                </span>
                                <Calculator className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {Number(product.cost) === 0 
                                  ? "Margin cannot be calculated when cost is $0.00" 
                                  : `Margin = ((${formatCurrency(product.price)} - ${formatCurrency(product.cost)}) / ${formatCurrency(product.cost)}) × 100 = ${marginValue.toFixed(2)}%`}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {getMarginLabel(marginCategory)}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        {product.quantity} 
                        {product.minStockLevel > 0 && (
                          <span className="text-xs text-muted-foreground ml-1">
                            (Min: {product.minStockLevel})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            stockStatus === LocalStockStatus.OUT_OF_STOCK
                              ? "destructive"
                              : stockStatus === LocalStockStatus.LOW_STOCK
                              ? "outline"
                              : "success"
                          }
                        >
                          {stockStatus === LocalStockStatus.OUT_OF_STOCK
                            ? "Out of Stock"
                            : stockStatus === LocalStockStatus.LOW_STOCK
                            ? "Low Stock"
                            : "In Stock"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <Link href={`/products/edit/${product.id}`}>
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
} 