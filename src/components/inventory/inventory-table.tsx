"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Search, 
  Sliders, 
  MapPin, 
  Edit,
  Battery, 
  BatteryLow,
  BatteryWarning,
  FileBarChart, 
  ClipboardList,
  Tag,
  Tags,
  Calculator,
  MoreHorizontal,
  Trash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StockStatus } from "@/services/inventoryService";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { calculateMargin } from "@/lib/client-utils";
import { getMarginCategory, getMarginColor, getMarginLabel } from "@/lib/margin-settings";

// Updated to match the actual data from Prisma
type InventoryItem = {
  id: string;
  name: string;
  description?: string;
  sku: string;
  price: number | string;
  cost: number | string;
  margin: number | string;
  categoryId?: string;
  category?: {
    id: string;
    name: string;
  };
  quantity: number;
  minStockLevel: number;
  lastUpdated: string | Date | null;
  location?: string;
  imageUrl?: string;
  active: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  [key: string]: any; // Allow any other properties
};

type Category = {
  id: string;
  name: string;
  _count?: {
    inventory: number;
  };
}

type InventoryTableProps = {
  inventoryItems: InventoryItem[];
  allCategories?: Category[];
};

export default function InventoryTable({ inventoryItems, allCategories }: InventoryTableProps) {
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>(inventoryItems);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);

  // Extract unique categories from inventory items or use provided categories
  useEffect(() => {
    if (allCategories && allCategories.length > 0) {
      setCategories(allCategories);
    } else {
      const uniqueCategories = new Map<string, Category>();
      
      inventoryItems.forEach(item => {
        if (item.category && !uniqueCategories.has(item.category.id)) {
          uniqueCategories.set(item.category.id, {
            id: item.category.id,
            name: item.category.name
          });
        }
      });
      
      setCategories(Array.from(uniqueCategories.values()));
    }
  }, [inventoryItems, allCategories]);

  // Apply filters whenever filter state or search query changes
  useEffect(() => {
    let results = [...inventoryItems];
    
    // Apply category filter
    if (categoryFilter !== "all") {
      results = results.filter((item) => 
        item.categoryId === categoryFilter
      );
    }
    
    // Apply search filter (case insensitive)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter((item) => 
        item.name.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query) ||
        (item.location && item.location.toLowerCase().includes(query))
      );
    }
    
    setFilteredItems(results);
  }, [categoryFilter, searchQuery, inventoryItems]);

  // Calculate stock status based on quantity and min level
  const calculateStockStatus = (quantity: number, minStockLevel: number): StockStatus => {
    if (quantity <= 0) {
      return StockStatus.OUT_OF_STOCK;
    }
    
    if (quantity <= minStockLevel) {
      return StockStatus.LOW;
    }
    
    return StockStatus.NORMAL;
  };

  // Calculate percentage for progress bar
  const calculateStockPercentage = (quantity: number, minStockLevel: number): number => {
    if (quantity <= 0) return 0;
    if (minStockLevel <= 0) return quantity > 0 ? 100 : 0;
    
    // Calculate as percentage of minimum stock level multiplied by 2 (so 100% = 2x min level)
    const percentage = (quantity / (minStockLevel * 2)) * 100;
    return Math.min(Math.max(percentage, 0), 100); // Clamp between 0-100
  };

  // Get stock status icon
  const getStockStatusIcon = (status: StockStatus) => {
    switch (status) {
      case StockStatus.NORMAL:
        return <Battery className="h-4 w-4 text-success" />;
      case StockStatus.LOW:
        return <BatteryLow className="h-4 w-4 text-warning-foreground" />;
      case StockStatus.OUT_OF_STOCK:
        return <BatteryWarning className="h-4 w-4 text-destructive" />;
    }
  };
  
  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Select 
            defaultValue="all" 
            onValueChange={(value) => setCategoryFilter(value)}
          >
            <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filtrar por categoría">
              <div className="flex items-center gap-2">
                <Tag className="h-3.5 w-3.5" />
                <SelectValue placeholder="Filtrar por categoría" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las Categorías</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Buscar inventario..." 
              className="pl-9 w-full sm:w-[220px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <FileBarChart className="h-4 w-4" />
            Exportar
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Reporte
          </Button>
        </div>
      </div>
      
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">SKU</TableHead>
              <TableHead className="min-w-[150px]">Producto</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Costo</TableHead>
              <TableHead>Margen</TableHead>
              <TableHead>Stock Actual</TableHead>
              <TableHead>Nivel Mínimo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Última Actualización</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => {
              const stockStatus = calculateStockStatus(item.quantity, item.minStockLevel);
              const statusText = 
                stockStatus === StockStatus.OUT_OF_STOCK ? "Sin Stock" :
                stockStatus === StockStatus.LOW ? "Stock Bajo" : "En Stock";
              const stockPercentage = calculateStockPercentage(item.quantity, item.minStockLevel);

              // Get margin category and color
              const marginValue = Number(item.cost) > 0 
                ? calculateMargin(Number(item.cost), Number(item.price))
                : Number(item.margin);
              const marginCategory = getMarginCategory(marginValue);
              const marginColor = getMarginColor(marginValue);

              return (
                <TableRow key={item.id} className="group">
                  <TableCell className="font-medium">{item.sku}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>
                    {item.category ? (
                      <Link 
                        href={`/inventory?category=${item.category.id}`}
                        className="flex items-center text-sm text-primary hover:underline"
                      >
                        <Tags className="h-3 w-3 mr-1" />
                        {item.category.name}
                      </Link>
                    ) : (
                      <Badge variant="outline" className="text-xs">Sin categoría</Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatCurrency(item.price)}</TableCell>
                  <TableCell>{formatCurrency(item.cost)}</TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1">
                            <span 
                              className="px-2 py-1 rounded-full text-xs"
                              style={{ backgroundColor: `${marginColor}40`, color: marginColor }}
                            >
                              {Number(item.cost) > 0 
                                ? calculateMargin(Number(item.cost), Number(item.price)).toFixed(2)
                                : Number(item.margin).toFixed(2)}%
                            </span>
                            <Calculator className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {Number(item.cost) === 0 
                              ? "No se puede calcular el margen cuando el costo es $0.00" 
                              : `Margen = ((${formatCurrency(item.price)} - ${formatCurrency(item.cost)}) / ${formatCurrency(item.cost)}) × 100 = ${calculateMargin(Number(item.cost), Number(item.price)).toFixed(2)}%`}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {getMarginLabel(marginCategory)}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="font-medium">{item.quantity}</TableCell>
                  <TableCell>{item.minStockLevel}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStockStatusIcon(stockStatus)}
                      <span>{statusText}</span>
                    </div>
                    <Progress value={stockPercentage} className="h-1 w-[60px]" />
                  </TableCell>
                  <TableCell>
                    {/* Update the date formatting to better handle various date formats */}
                    {item.lastUpdated 
                      ? formatDate(typeof item.lastUpdated === 'string' 
                          ? new Date(item.lastUpdated) 
                          : item.lastUpdated instanceof Date 
                            ? item.lastUpdated 
                            : new Date()) 
                      : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        asChild 
                        variant="secondary" 
                        size="sm" 
                        className="text-green-600 font-medium"
                      >
                        <Link href={`/inventory/adjust/${item.id}/add`} title="Sumar Stock">
                          <span className="text-xs font-medium mr-1">+</span>
                          Sumar
                        </Link>
                      </Button>
                      <Button 
                        asChild 
                        variant="secondary" 
                        size="sm" 
                        className="text-red-600 font-medium"
                      >
                        <Link href={`/inventory/adjust/${item.id}/remove`} title="Restar Stock">
                          <span className="text-xs font-medium mr-1">-</span>
                          Restar
                        </Link>
                      </Button>
                      <Button 
                        asChild 
                        variant="secondary" 
                        size="sm" 
                        className="font-medium"
                      >
                        <Link href={`/inventory/adjust/${item.id}`} title="Editar Stock">
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No se encontraron items en el inventario.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
} 