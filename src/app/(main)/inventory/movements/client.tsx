"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowUp, 
  ArrowDown, 
  RotateCw, 
  Clipboard, 
  CalendarRange, 
  Filter, 
  Loader2, 
  Search,
  SlidersHorizontal,
  Tag,
  RefreshCw,
  Download,
  History,
  DollarSign,
  CreditCard 
} from "lucide-react";
import { formatDate, formatDateTime, ensureValidDate, startOfDay, endOfDay, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; 

const MOVEMENT_TYPES = [
  { value: "all", label: "Todos los tipos" },
  { value: "STOCK_IN", label: "Entradas" },
  { value: "STOCK_OUT", label: "Salidas" },
  { value: "ADJUSTMENT", label: "Ajustes" },
  { value: "INITIAL", label: "Iniciales" }
];

// Define sorting options
const SORT_OPTIONS = [
  { value: "date-desc", label: "Fecha (más reciente)" },
  { value: "date-asc", label: "Fecha (más antigua)" },
  { value: "product-asc", label: "Producto (A-Z)" },
  { value: "product-desc", label: "Producto (Z-A)" },
  { value: "quantity-desc", label: "Cantidad (mayor)" },
  { value: "quantity-asc", label: "Cantidad (menor)" }
];

export default function MovementsClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // States
  const [isLoading, setIsLoading] = useState(true);
  const [movements, setMovements] = useState([]);
  const [priceHistory, setPriceHistory] = useState([]);
  const [isPriceHistoryLoading, setIsPriceHistoryLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, totalPages: 0 });
  const [categories, setCategories] = useState<Array<{id: string; name: string}>>([]);
  
  // Filter states
  const [type, setType] = useState(searchParams.get("type") || "all");
  const [startDate, setStartDate] = useState<Date | undefined>(
    searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined
  );
  const [categoryId, setCategoryId] = useState(searchParams.get("categoryId") || "all");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "date-desc");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "stock");

  // Load categories on component mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error("Error loading categories:", error);
      }
    }
    
    loadCategories();
  }, []);

  // Load movements based on current filters
  useEffect(() => {
    async function loadMovements() {
      if (activeTab !== "stock") return;
      
      setIsLoading(true);
      
      try {
        // Build query string
        const params = new URLSearchParams();
        if (type && type !== "all") params.append("type", type);
        if (startDate) params.append("startDate", startDate.toISOString());
        if (endDate) params.append("endDate", endDate.toISOString());
        if (categoryId && categoryId !== "all") params.append("categoryId", categoryId);
        if (searchQuery) params.append("search", searchQuery);
        if (sort) params.append("sort", sort);
        
        // Fetch data
        const response = await fetch(`/api/inventory/movements?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to load movements");
        
        const data = await response.json();
        
        // Process movements to ensure valid dates
        const processedMovements = data.data.map((movement: any) => ({
          ...movement,
          date: ensureValidDate(movement.date)
        }));
        
        setMovements(processedMovements);
        setPagination(data.pagination);
      } catch (error) {
        console.error("Error loading movements:", error);
        // Could add error state and display here
      } finally {
        setIsLoading(false);
      }
    }
    
    loadMovements();
  }, [type, startDate, endDate, categoryId, searchQuery, sort, activeTab]);
  
  // Load price history based on current filters
  useEffect(() => {
    async function loadPriceHistory() {
      if (activeTab !== "price") return;
      
      setIsPriceHistoryLoading(true);
      
      try {
        // Build query string
        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate.toISOString());
        if (endDate) params.append("endDate", endDate.toISOString());
        if (categoryId && categoryId !== "all") params.append("categoryId", categoryId);
        if (searchQuery) params.append("search", searchQuery);
        if (sort) params.append("sort", sort);
        
        // Fetch price history data
        const response = await fetch(`/api/inventory/price-history?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to load price history");
        
        const data = await response.json();
        setPriceHistory(data);
      } catch (error) {
        console.error("Error loading price history:", error);
      } finally {
        setIsPriceHistoryLoading(false);
      }
    }
    
    loadPriceHistory();
  }, [startDate, endDate, categoryId, searchQuery, sort, activeTab]);
  
  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Update or remove params based on filter values
    params.set("tab", activeTab);
    
    if (type && type !== "all" && activeTab === "stock") params.set("type", type);
    else params.delete("type");
    
    if (startDate) params.set("startDate", startDate.toISOString());
    else params.delete("startDate");
    
    if (endDate) params.set("endDate", endDate.toISOString());
    else params.delete("endDate");
    
    if (categoryId && categoryId !== "all") params.set("categoryId", categoryId);
    else params.delete("categoryId");
    
    if (searchQuery) params.set("search", searchQuery);
    else params.delete("search");
    
    if (sort) params.set("sort", sort);
    else params.delete("sort");
    
    // Update URL without causing a navigation
    const newUrl = `${pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  }, [type, startDate, endDate, categoryId, searchQuery, sort, activeTab, pathname, router, searchParams]);
  
  // Helper to get movement type info for UI display
  const getMovementTypeInfo = (type: string) => {
    switch (type) {
      case "STOCK_IN":
        return { 
          label: "Entrada", 
          icon: <ArrowUp className="h-4 w-4 text-green-600" />,
          variant: "outline",
          color: "text-green-600" 
        };
      case "STOCK_OUT":
        return { 
          label: "Salida", 
          icon: <ArrowDown className="h-4 w-4 text-red-600" />,
          variant: "outline",
          color: "text-red-600" 
        };
      case "ADJUSTMENT":
        return { 
          label: "Ajuste", 
          icon: <RotateCw className="h-4 w-4 text-amber-600" />,
          variant: "outline",
          color: "text-amber-600" 
        };
      case "INITIAL":
        return { 
          label: "Inicial", 
          icon: <Clipboard className="h-4 w-4 text-blue-600" />,
          variant: "outline",
          color: "text-blue-600" 
        };
      default:
        return { 
          label: type, 
          icon: null,
          variant: "outline",
          color: "" 
        };
    }
  };
  
  // Apply a predefined date range
  const applyDateRange = (range: string) => {
    const now = new Date();
    
    switch (range) {
      case "today":
        setStartDate(startOfDay(now));
        setEndDate(endOfDay(now));
        break;
      case "yesterday": {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        setStartDate(startOfDay(yesterday));
        setEndDate(endOfDay(yesterday));
        break;
      }
      case "thisWeek": {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday as first day
        setStartDate(startOfDay(startOfWeek));
        setEndDate(endOfDay(now));
        break;
      }
      case "thisMonth": {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        setStartDate(startOfDay(startOfMonth));
        setEndDate(endOfDay(now));
        break;
      }
      case "lastMonth": {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        setStartDate(startOfDay(lastMonth));
        setEndDate(endOfDay(endOfLastMonth));
        break;
      }
      case "clear":
        setStartDate(undefined);
        setEndDate(undefined);
        break;
      default:
        break;
    }
  };
  
  // Reset all filters
  const resetFilters = () => {
    setType("all");
    setStartDate(undefined);
    setEndDate(undefined);
    setCategoryId("all");
    setSearchQuery("");
    setSort("date-desc");
    setIsFiltersOpen(false);
  };
  
  // Handle form submission for the search input
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Already handled by the input field's onChange
  };
  
  // Count active filters for the filter button badge
  const getActiveFilterCount = () => {
    let count = 0;
    if (type && type !== "all") count++;
    if (startDate) count++;
    if (endDate) count++;
    if (categoryId && categoryId !== "all") count++;
    if (searchQuery) count++;
    if (sort && sort !== "date-desc") count++; // Only count if not default
    return count;
  };
  
  // Render price change indicator
  const renderPriceChangeIndicator = (oldValue: number | null, newValue: number | null) => {
    if (oldValue === null || newValue === null) return null;
    
    if (newValue > oldValue) {
      return <ArrowUp className="h-4 w-4 text-red-500" />;
    } else if (newValue < oldValue) {
      return <ArrowDown className="h-4 w-4 text-green-500" />;
    }
    
    return null;
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
          <TabsList className="mb-4 sm:mb-0">
            <TabsTrigger value="stock" className="flex items-center gap-2">
              <RotateCw className="h-4 w-4" />
              <span>Movimientos de Stock</span>
            </TabsTrigger>
            <TabsTrigger value="price" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span>Historial de Precios</span>
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className={`relative flex-1 sm:max-w-[300px] transition-all duration-200 ${isSearchFocused ? 'flex-grow' : ''}`}>
              <form onSubmit={handleSearch} className="w-full">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={activeTab === "price" ? "Buscar historial de precios..." : "Buscar movimientos..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className="w-full pl-9 pr-4"
                />
              </form>
            </div>
            
            <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <SlidersHorizontal className="h-4 w-4" />
                  {getActiveFilterCount() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full h-4 w-4 text-[10px] flex items-center justify-center">
                      {getActiveFilterCount()}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] sm:w-[400px]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Filtros</h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8" 
                      onClick={resetFilters}
                    >
                      Limpiar
                    </Button>
                  </div>
                  
                  {activeTab === "stock" && (
                    <div className="space-y-2">
                      <Label htmlFor="type">Tipo de Movimiento</Label>
                      <Select value={type} onValueChange={setType}>
                        <SelectTrigger id="type" className="w-full">
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {MOVEMENT_TYPES.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fecha Inicial</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarRange className="mr-2 h-4 w-4" />
                            {startDate ? (
                              format(startDate, "dd/MM/yyyy")
                            ) : (
                              <span>Seleccionar fecha</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                            locale={es}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Fecha Final</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarRange className="mr-2 h-4 w-4" />
                            {endDate ? (
                              format(endDate, "dd/MM/yyyy")
                            ) : (
                              <span>Seleccionar fecha</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            initialFocus
                            locale={es}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => applyDateRange("today")}
                    >
                      Hoy
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => applyDateRange("yesterday")}
                    >
                      Ayer
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => applyDateRange("thisWeek")}
                    >
                      Esta Semana
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => applyDateRange("thisMonth")}
                    >
                      Este Mes
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => applyDateRange("lastMonth")}
                    >
                      Mes Anterior
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => applyDateRange("clear")}
                    >
                      Borrar
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger id="category" className="w-full">
                        <SelectValue placeholder="Filtrar por categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las categorías</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sort">Ordenar por</Label>
                    <Select value={sort} onValueChange={setSort}>
                      <SelectTrigger id="sort" className="w-full">
                        <SelectValue placeholder="Ordenar por" />
                      </SelectTrigger>
                      <SelectContent>
                        {SORT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="pt-2 flex justify-end">
                    <Button onClick={() => setIsFiltersOpen(false)}>
                      Aplicar Filtros
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Exportar</DropdownMenuLabel>
                <DropdownMenuItem>
                  Exportar a Excel
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Exportar a CSV
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Imprimir reporte
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <TabsContent value="stock" className="space-y-4">
          {isLoading ? (
            <div className="h-[300px] w-full flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Cargando movimientos...</p>
            </div>
          ) : movements.length === 0 ? (
            <div className="border rounded-md p-8 text-center">
              <div className="flex flex-col items-center justify-center">
                <div className="bg-muted rounded-full p-3 mb-4">
                  <Clipboard className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No hay movimientos</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                  No se encontraron movimientos de inventario con los filtros actuales.
                </p>
                <Button variant="outline" onClick={resetFilters}>
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead>Usuario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement: any) => {
                    const typeInfo = getMovementTypeInfo(movement.type);
                    return (
                      <TableRow key={movement.id} className="group">
                        <TableCell className="font-medium">
                          {formatDateTime(movement.date)}
                        </TableCell>
                        <TableCell>
                          {movement.inventoryItem?.name || "Producto desconocido"}
                          <div className="text-xs text-muted-foreground mt-1">
                            SKU: {movement.inventoryItem?.sku || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className={`flex items-center space-x-1 ${typeInfo.color} border-${typeInfo.color.split('-')[1]}`}>
                              {typeInfo.icon}
                              <span>{typeInfo.label}</span>
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {movement.quantity > 0 ? "+" : ""}{movement.quantity}
                        </TableCell>
                        <TableCell>
                          {movement.notes || <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell>
                          {movement.user ? (
                            <div>
                              <div className="font-medium">
                                {movement.user.firstName && movement.user.lastName 
                                  ? `${movement.user.firstName} ${movement.user.lastName}`
                                  : movement.user.email || "Usuario del sistema"}
                              </div>
                              {movement.user.email && (
                                <div className="text-xs text-muted-foreground">
                                  {movement.user.email}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Sistema</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="price" className="space-y-4">
          {isPriceHistoryLoading ? (
            <div className="h-[300px] w-full flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Cargando historial de precios...</p>
            </div>
          ) : priceHistory.length === 0 ? (
            <div className="border rounded-md p-8 text-center">
              <div className="flex flex-col items-center justify-center">
                <div className="bg-muted rounded-full p-3 mb-4">
                  <History className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No hay historial de precios</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                  No se encontraron cambios de precio o costo con los filtros actuales.
                </p>
                <Button variant="outline" onClick={resetFilters}>
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Precio Anterior</TableHead>
                    <TableHead>Precio Nuevo</TableHead>
                    <TableHead>Costo Anterior</TableHead>
                    <TableHead>Costo Nuevo</TableHead>
                    <TableHead>Margen Anterior</TableHead>
                    <TableHead>Margen Nuevo</TableHead>
                    <TableHead>Razón del Cambio</TableHead>
                    <TableHead>Usuario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {priceHistory.map((record: any) => (
                    <TableRow key={record.id} className="group">
                      <TableCell className="font-medium">
                        {formatDateTime(record.createdAt)}
                      </TableCell>
                      <TableCell>
                        {record.inventoryItem?.name || "Producto desconocido"}
                        <div className="text-xs text-muted-foreground mt-1">
                          SKU: {record.inventoryItem?.sku || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {record.oldPrice !== null ? formatCurrency(record.oldPrice) : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {record.newPrice !== null ? formatCurrency(record.newPrice) : "-"}
                          {renderPriceChangeIndicator(record.oldPrice, record.newPrice)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {record.oldCost !== null ? formatCurrency(record.oldCost) : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {record.newCost !== null ? formatCurrency(record.newCost) : "-"}
                          {renderPriceChangeIndicator(record.oldCost, record.newCost)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {record.oldMargin !== null ? `${record.oldMargin}%` : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {record.newMargin !== null ? `${record.newMargin}%` : "-"}
                          {renderPriceChangeIndicator(record.oldMargin, record.newMargin)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {record.changeReason || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        {record.user ? (
                          <div>
                            <div className="font-medium">
                              {record.user.firstName && record.user.lastName 
                                ? `${record.user.firstName} ${record.user.lastName}`
                                : record.user.email || "Usuario del sistema"}
                            </div>
                            {record.user.email && (
                              <div className="text-xs text-muted-foreground">
                                {record.user.email}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Sistema</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 