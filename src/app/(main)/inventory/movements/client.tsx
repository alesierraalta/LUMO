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
  Download 
} from "lucide-react";
import { formatDate, formatDateTime, ensureValidDate, startOfDay, endOfDay } from "@/lib/utils";
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
  }, [type, startDate, endDate, categoryId, searchQuery, sort]);
  
  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Update or remove params based on filter values
    if (type && type !== "all") params.set("type", type);
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
  }, [type, startDate, endDate, categoryId, searchQuery, sort, pathname, router, searchParams]);
  
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
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        setStartDate(startOfDay(startOfLastMonth));
        setEndDate(endOfDay(endOfLastMonth));
        break;
      }
      case "clear":
        setStartDate(undefined);
        setEndDate(undefined);
        break;
    }
  };
  
  // Clear all filters
  const resetFilters = () => {
    setType("all");
    setStartDate(undefined);
    setEndDate(undefined);
    setCategoryId("all");
    setSearchQuery("");
    setSort("date-desc");
  };

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The search is already handled by the useEffect
    setIsSearchFocused(false);
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (type && type !== "all") count++;
    if (startDate || endDate) count++;
    if (categoryId && categoryId !== "all") count++;
    if (searchQuery) count++;
    if (sort && sort !== "date-desc") count++;
    return count;
  };
  
  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-green-100">
                <ArrowUp className="h-4 w-4 text-green-600" />
              </div>
              Entradas
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-2xl font-bold">
              {movements.filter((m: any) => m.type === "STOCK_IN").length}
            </div>
            <p className="text-xs text-muted-foreground">Movimientos totales</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-red-100">
                <ArrowDown className="h-4 w-4 text-red-600" />
              </div>
              Salidas
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-2xl font-bold">
              {movements.filter((m: any) => m.type === "STOCK_OUT").length}
            </div>
            <p className="text-xs text-muted-foreground">Movimientos totales</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-amber-100">
                <RotateCw className="h-4 w-4 text-amber-600" />
              </div>
              Ajustes
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-2xl font-bold">
              {movements.filter((m: any) => m.type === "ADJUSTMENT").length}
            </div>
            <p className="text-xs text-muted-foreground">Movimientos totales</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        {/* Search bar */}
        <div className="relative w-full md:w-72 mb-2 sm:mb-0">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar producto o SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              className="pl-9 pr-4 py-2 h-10 w-full"
            />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                className="absolute right-1 top-1 h-8 w-8 p-0"
                onClick={() => setSearchQuery("")}
              >
                ×
              </Button>
            )}
          </form>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Filter button */}
          <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filtros
                {getActiveFilterCount() > 0 && (
                  <Badge className="ml-1 bg-primary">{getActiveFilterCount()}</Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 sm:w-96 p-4">
              <div className="space-y-4">
                <h4 className="font-medium">Filtrar Movimientos</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="movement-type">Tipo de Movimiento</Label>
                  <Select 
                    value={type} 
                    onValueChange={setType}
                  >
                    <SelectTrigger id="movement-type" className="w-full">
                      <SelectValue placeholder="Todos los tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOVEMENT_TYPES.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Select 
                    value={categoryId} 
                    onValueChange={setCategoryId}
                  >
                    <SelectTrigger id="category" className="w-full">
                      <SelectValue placeholder="Todas las categorías" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      {categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Rango de Fechas</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarRange className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PP", { locale: es }) : "Desde"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarRange className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PP", { locale: es }) : "Hasta"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sort">Ordenar por</Label>
                  <Select 
                    value={sort} 
                    onValueChange={setSort}
                  >
                    <SelectTrigger id="sort" className="w-full">
                      <SelectValue placeholder="Fecha (más reciente)" />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs" 
                    onClick={() => applyDateRange('today')}
                  >
                    Hoy
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs" 
                    onClick={() => applyDateRange('yesterday')}
                  >
                    Ayer
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs" 
                    onClick={() => applyDateRange('thisWeek')}
                  >
                    Esta semana
                  </Button>
                </div>
                
                <div className="flex justify-between mt-4">
                  <Button 
                    variant="ghost" 
                    onClick={resetFilters}
                  >
                    Limpiar filtros
                  </Button>
                  <Button 
                    onClick={() => setIsFiltersOpen(false)}
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Sort button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Ordenar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {SORT_OPTIONS.map(option => (
                <DropdownMenuItem 
                  key={option.value}
                  className={sort === option.value ? "bg-muted" : ""}
                  onClick={() => setSort(option.value)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export button */}
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>

          {/* Refresh button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10" 
            onClick={() => {
              setIsLoading(true);
              setTimeout(() => setIsLoading(false), 500);
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Active filters display */}
      {getActiveFilterCount() > 0 && (
        <div className="flex flex-wrap gap-2 items-center my-4 bg-muted/40 p-3 rounded-md border">
          <span className="text-sm font-medium text-muted-foreground mr-2">Filtros activos:</span>
          
          {type && type !== "all" && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Tipo: {MOVEMENT_TYPES.find(t => t.value === type)?.label}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 ml-1 p-0" 
                onClick={() => setType("all")}
              >
                ×
              </Button>
            </Badge>
          )}
          
          {categoryId && categoryId !== "all" && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Tag className="h-3 w-3 mr-1" />
              Categoría: {categories.find(c => c.id === categoryId)?.name || 'Desconocida'}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 ml-1 p-0" 
                onClick={() => setCategoryId("all")}
              >
                ×
              </Button>
            </Badge>
          )}
          
          {(startDate || endDate) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Fechas: {startDate ? format(startDate, "dd/MM/yyyy") : "inicio"} - {endDate ? format(endDate, "dd/MM/yyyy") : "hoy"}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 ml-1 p-0" 
                onClick={() => { setStartDate(undefined); setEndDate(undefined); }}
              >
                ×
              </Button>
            </Badge>
          )}
          
          {searchQuery && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Búsqueda: {searchQuery}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 ml-1 p-0" 
                onClick={() => setSearchQuery("")}
              >
                ×
              </Button>
            </Badge>
          )}
          
          {sort && sort !== "date-desc" && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Orden: {SORT_OPTIONS.find(o => o.value === sort)?.label}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 ml-1 p-0" 
                onClick={() => setSort("date-desc")}
              >
                ×
              </Button>
            </Badge>
          )}
          
          <Button 
            variant="link" 
            className="text-xs h-auto p-1 ml-auto" 
            onClick={resetFilters}
          >
            Limpiar todos
          </Button>
        </div>
      )}
      
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : movements.length === 0 ? (
        <div className="text-center p-8 border rounded-md bg-muted/10">
          <p className="text-muted-foreground">No hay movimientos que coincidan con los filtros aplicados</p>
          {getActiveFilterCount() > 0 && (
            <Button 
              variant="link" 
              onClick={resetFilters} 
              className="mt-2"
            >
              Quitar filtros
            </Button>
          )}
        </div>
      ) : (
        <Table>
          <TableCaption>
            Total de movimientos: {pagination.total} {pagination.total > pagination.limit && `(mostrando ${pagination.limit})`}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead>Notas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((movement: any) => {
              const typeInfo = getMovementTypeInfo(movement.type);
              return (
                <TableRow key={movement.id}>
                  <TableCell className="font-medium">
                    {formatDateTime(movement.date)}
                  </TableCell>
                  <TableCell>{movement.inventoryItem.name}</TableCell>
                  <TableCell>{movement.inventoryItem.sku}</TableCell>
                  <TableCell>
                    {movement.inventoryItem.category ? (
                      <Badge variant="outline" className="bg-muted/40 flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {movement.inventoryItem.category.name}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Sin categoría</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`flex items-center gap-1 ${
                        movement.type === "STOCK_IN" ? "bg-green-50 text-green-600 border-green-200" :
                        movement.type === "STOCK_OUT" ? "bg-red-50 text-red-600 border-red-200" :
                        movement.type === "ADJUSTMENT" ? "bg-amber-50 text-amber-600 border-amber-200" :
                        movement.type === "INITIAL" ? "bg-blue-50 text-blue-600 border-blue-200" : ""
                      }`}
                    >
                      {typeInfo.icon}
                      <span>{typeInfo.label}</span>
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <span className={
                      movement.type === "STOCK_IN" ? "text-green-600" :
                      movement.type === "STOCK_OUT" ? "text-red-600" :
                      movement.type === "ADJUSTMENT" ? "text-amber-600" :
                      movement.type === "INITIAL" ? "text-blue-600" : ""
                    }>
                      {movement.type === "STOCK_IN" && "+"}
                      {movement.type === "STOCK_OUT" && "-"}
                      {movement.quantity}
                    </span>
                  </TableCell>
                  <TableCell>
                    {movement.notes || "-"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
} 