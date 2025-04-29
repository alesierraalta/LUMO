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
  ClipboardList 
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
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { StockStatus } from "@/services/inventoryService";
import { formatDate } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

// Updated to match the actual data from Prisma
type InventoryItem = {
  id: string;
  product: {
    id: string;
    name: string;
    [key: string]: any; // Allow any other properties from the product
  };
  quantity: number;
  minStockLevel: number;
  lastUpdated: string | Date | null;
  location?: string;
  [key: string]: any; // Allow any other properties from the inventory item
};

type InventoryTableProps = {
  inventoryItems: InventoryItem[];
};

export default function InventoryTable({ inventoryItems }: InventoryTableProps) {
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>(inventoryItems);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Apply filters whenever filter state or search query changes
  useEffect(() => {
    let results = [...inventoryItems];
    
    // Apply status filter
    if (statusFilter !== "all") {
      results = results.filter((item) => {
        const status = calculateStockStatus(item.quantity, item.minStockLevel);
        if (statusFilter === "low") return status === StockStatus.LOW;
        if (statusFilter === "out") return status === StockStatus.OUT_OF_STOCK;
        if (statusFilter === "normal") return status === StockStatus.NORMAL;
        return true;
      });
    }
    
    // Apply search filter (case insensitive)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter((item) => 
        item.product.name.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query) ||
        (item.location && item.location.toLowerCase().includes(query))
      );
    }
    
    setFilteredItems(results);
  }, [statusFilter, searchQuery, inventoryItems]);

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
            onValueChange={(value) => setStatusFilter(value)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Items</SelectItem>
              <SelectItem value="low">Stock Bajo</SelectItem>
              <SelectItem value="out">Sin Stock</SelectItem>
              <SelectItem value="normal">Stock Normal</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Buscar en inventario..." 
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
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead className="min-w-[150px]">Producto</TableHead>
              <TableHead>Stock Actual</TableHead>
              <TableHead>Stock Mínimo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Actualizado</TableHead>
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

              return (
                <TableRow key={item.id} className="group">
                  <TableCell className="font-medium">{item.id.substring(0, 8)}</TableCell>
                  <TableCell>{item.product.name}</TableCell>
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
                    {item.lastUpdated ? formatDate(new Date(item.lastUpdated)) : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        asChild 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 opacity-70 group-hover:opacity-100"
                      >
                        <Link href={`/inventory/adjust/${item.id}`} title="Ajustar Stock">
                          <Sliders className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button 
                        asChild 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 opacity-70 group-hover:opacity-100"
                      >
                        <Link href={`/inventory/location/${item.id}`} title="Ubicación">
                          <MapPin className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 opacity-70 group-hover:opacity-100"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/inventory/adjust/${item.id}`}>
                              <Sliders className="h-4 w-4 mr-2" />
                              Ajustar Stock
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/inventory/location/${item.id}`}>
                              <MapPin className="h-4 w-4 mr-2" />
                              Cambiar Ubicación
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link 
                              href={`/products/edit/${item.product.id}`}
                              className="text-muted-foreground"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar Producto
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}

            {filteredItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No se encontraron items de inventario que coincidan con los filtros.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
} 