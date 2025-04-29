"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, Pencil, Trash2 } from "lucide-react"
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
import { StockStatus, calculateStockStatus } from "@/services/inventoryService"
import ProductFilters from "./product-filters"
import { SortOrder } from "@/services/productService"

interface ProductListProps {
  products: any[]
}

export default function ProductList({ products: initialProducts }: ProductListProps) {
  const [filteredProducts, setFilteredProducts] = useState(initialProducts)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<{
    minMargin?: number
    maxMargin?: number
    sortBy?: string
    sortOrder?: SortOrder
  }>({})

  // Apply filters when they change
  useEffect(() => {
    let result = [...initialProducts]
    
    // Apply text search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(product => 
        product.name.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term) ||
        (product.description && product.description.toLowerCase().includes(term))
      )
    }
    
    // Apply margin filters
    if (filters.minMargin !== undefined) {
      result = result.filter(product => product.margin >= filters.minMargin!)
    }
    
    if (filters.maxMargin !== undefined) {
      result = result.filter(product => product.margin <= filters.maxMargin!)
    }
    
    // Apply sorting
    if (filters.sortBy === "margin") {
      result.sort((a, b) => {
        if (filters.sortOrder === "asc") {
          return a.margin - b.margin
        } else {
          return b.margin - a.margin
        }
      })
    }
    
    setFilteredProducts(result)
  }, [initialProducts, searchTerm, filters])

  // Handle filter changes from the filter component
  const handleFilterChange = (newFilters: {
    minMargin?: number
    maxMargin?: number
    sortBy?: string
    sortOrder?: SortOrder
  }) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Product Catalog</CardTitle>
        <CardDescription>
          View and manage all products in your inventory
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                type="text" 
                placeholder="Search products..." 
                className="pl-9 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <ProductFilters onFilterChange={handleFilterChange} />
        </div>
        
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">SKU</TableHead>
                <TableHead className="min-w-[150px]">Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Margin</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product: any) => {
                const stockStatus = product.inventory 
                  ? calculateStockStatus(product.inventory.quantity, product.inventory.minStockLevel) 
                  : StockStatus.OUT_OF_STOCK;
                
                return (
                <TableRow key={product.id} className="group">
                    <TableCell className="font-medium">{product.sku}</TableCell>
                  <TableCell>{product.name}</TableCell>
                    <TableCell>{product.category?.name || "Uncategorized"}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                        stockStatus === StockStatus.OUT_OF_STOCK 
                        ? "bg-destructive/20 text-destructive" 
                          : stockStatus === StockStatus.LOW
                        ? "bg-warning/20 text-warning-foreground" 
                        : "bg-success/20 text-success"
                    }`}>
                        {product.inventory?.quantity || 0}
                    </span>
                  </TableCell>
                    <TableCell>${Number(product.cost).toFixed(2)}</TableCell>
                    <TableCell>${Number(product.price).toFixed(2)}</TableCell>
                    <TableCell>{Number(product.margin).toFixed(2)}%</TableCell>
                  <TableCell className="text-right space-x-1">
                      <Link href={`/products/edit/${product.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-70 group-hover:opacity-100">
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                      </Link>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-70 group-hover:opacity-100">
                      <Trash2 className="h-4 w-4 text-destructive" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </TableCell>
                </TableRow>
                );
              })}
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
} 