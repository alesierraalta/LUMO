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
  Calculator
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
import { formatDate, formatCurrency } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
}

type InventoryTableProps = {
  inventoryItems: InventoryItem[];
};

export default function InventoryTable({ inventoryItems }: InventoryTableProps) {
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>(inventoryItems);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);

  // Extract unique categories from inventory items
  useEffect(() => {
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
  }, [inventoryItems]);

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
  }, [statusFilter, categoryFilter, searchQuery, inventoryItems]);

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
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
              <SelectItem value="normal">In Stock</SelectItem>
            </SelectContent>
          </Select>
          
          <Select 
            defaultValue="all" 
            onValueChange={(value) => setCategoryFilter(value)}
          >
            <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filter by category">
              <div className="flex items-center gap-2">
                <Tag className="h-3.5 w-3.5" />
                <SelectValue placeholder="Filter by category" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
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
              placeholder="Search inventory..." 
              className="pl-9 w-full sm:w-[220px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <FileBarChart className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Report
          </Button>
        </div>
      </div>
      
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">SKU</TableHead>
              <TableHead className="min-w-[150px]">Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Margin</TableHead>
              <TableHead>Current Stock</TableHead>
              <TableHead>Min Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => {
              const stockStatus = calculateStockStatus(item.quantity, item.minStockLevel);
              const statusText = 
                stockStatus === StockStatus.OUT_OF_STOCK ? "Out of Stock" :
                stockStatus === StockStatus.LOW ? "Low Stock" : "In Stock";
              const stockPercentage = calculateStockPercentage(item.quantity, item.minStockLevel);

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
                            {Number(item.margin).toFixed(2)}%
                            <Calculator className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {Number(item.price) === 0 
                              ? "Margin cannot be calculated when price is $0.00" 
                              : `Margin calculation: ${((Number(item.price) - Number(item.cost)) / Number(item.price) * 100).toFixed(2)}%`
                            }
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
                        <Link href={`/inventory/adjust/${item.id}`} title="Adjust Stock">
                          <Sliders className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button 
                        asChild 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 opacity-70 group-hover:opacity-100"
                      >
                        <Link href={`/inventory/location/${item.id}`} title="Location">
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
                              Adjust Stock
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/inventory/edit/${item.id}`}>
                              <Tag className="h-4 w-4 mr-2" />
                              Edit Item
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No inventory items found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
} 