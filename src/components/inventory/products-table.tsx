"use client"

import * as React from "react"
import Link from "next/link"
import { Edit, MoreHorizontal, Trash, Tags, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Product {
  id: string
  name: string
  description?: string
  price: number
  cost: number
  margin: number
  category?: {
    id: string
    name: string
  }
}

interface ProductsTableProps {
  products: Product[]
}

export default function ProductsTable({ products }: ProductsTableProps) {
  // Helper function to calculate display margin text
  const getMarginDisplay = (product: Product) => {
    if (!product || product.price === undefined || product.cost === undefined) {
      return '0.00%';
    }

    const price = Number(product.price);
    const cost = Number(product.cost);
    
    if (cost === 0) {
      if (price === 0) {
        return '0.00%'; // Both cost and price are 0, display 0%
      }
      return '100.00%'; // Cost is 0 but price is not, effectively 100% markup
    }
    
    // Use the margin value from the product if it exists
    if (product.margin !== undefined && product.margin !== null) {
      return `${Number(product.margin).toFixed(2)}%`;
    }
    
    // Calculate margin as fallback
    if (price > 0) {
      const margin = ((price - cost) / price) * 100;
      return `${margin.toFixed(2)}%`;
    }
    
    return '0.00%';
  };

  // Helper function to get tooltip content
  const getTooltipContent = (product: Product) => {
    if (product.cost === 0) {
      if (product.price === 0) {
        return "No hay margen cuando el costo y precio son cero";
      }
      return "Margen del 100% cuando el costo es cero";
    }
    
    const marginFormula = product.cost > 0 ? 
      `(${formatCurrency(product.price)} - ${formatCurrency(product.cost)}) / ${formatCurrency(product.price)} × 100 = ${Number(product.margin).toFixed(2)}%` :
      "No se puede calcular margen con costo cero";
      
    return marginFormula;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Cost</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Margin</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>
                {product.category ? (
                  <Link 
                    href={`/products?category=${product.category.id}`}
                    className="flex items-center text-sm text-primary hover:underline"
                  >
                    <Tags className="h-3 w-3 mr-1" />
                    {product.category.name}
                  </Link>
                ) : (
                  <Badge variant="outline" className="text-xs">Sin categoría</Badge>
                )}
              </TableCell>
              <TableCell>{formatCurrency(product.cost)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {formatCurrency(product.price)}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Calculator className="h-3.5 w-3.5 text-muted-foreground ml-1" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Margen: {getMarginDisplay(product)}</p>
                        <p className="text-xs">{getTooltipContent(product)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableCell>
              <TableCell>{getMarginDisplay(product)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/inventory/edit/${product.id}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/products/edit/${product.id}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Product Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {products.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No products found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
} 