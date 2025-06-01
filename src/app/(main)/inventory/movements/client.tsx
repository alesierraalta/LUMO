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
  CreditCard,
  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle,
  ShoppingCart
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
import { TabState, Movement } from "./types";

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

// Función para obtener movimientos del servidor
async function getMovements(tab: TabState) {
  try {
    // Mapear los tipos de pestaña a los tipos de movimiento que espera la API
    let apiType = "all";
    
    switch(tab) {
      case "in":
        apiType = "STOCK_IN";
        break;
      case "out":
        apiType = "STOCK_OUT";
        break;
      case "adjustment":
        apiType = "ADJUSTMENT";
        break;
      case "all":
      default:
        apiType = "all";
        break;
    }
    
    const response = await fetch(`/api/inventory/movements?type=${apiType}`);
    if (!response.ok) {
      throw new Error("Error al cargar los movimientos");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching movements:", error);
    return { movements: [] };
  }
}

// Función para obtener ventas del servidor
async function getSales() {
  try {
    const response = await fetch("/api/inventory/sales");
    if (!response.ok) {
      throw new Error("Error al cargar las ventas");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching sales:", error);
    return { sales: [] };
  }
}

// Componente para la pestaña de Movimientos
function MovementsTable({ movements }: { movements: Movement[] }) {
  if (!movements || movements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <RotateCw className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No hay movimientos registrados</h3>
        <p className="text-muted-foreground mt-1 max-w-md">
          No se encontraron movimientos de inventario en esta categoría.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Producto</TableHead>
          <TableHead>Cantidad</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Notas</TableHead>
          <TableHead>Usuario</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movements.map((movement) => (
          <TableRow key={movement.id}>
            <TableCell className="whitespace-nowrap">
              {formatDateTime(movement.date)}
            </TableCell>
            <TableCell>
              <div className="font-medium">
                {movement.product?.name || "Producto no disponible"}
              </div>
              <div className="text-xs text-muted-foreground">
                SKU: {movement.product?.sku || "N/A"}
              </div>
            </TableCell>
            <TableCell>
              <div className={`font-medium flex items-center ${movement.quantity > 0 ? "text-green-600" : "text-red-600"}`}>
                {movement.quantity > 0 ? (
                  <ArrowUpCircle className="mr-1 h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownCircle className="mr-1 h-4 w-4 text-red-500" />
                )}
                {Math.abs(movement.quantity)}
              </div>
            </TableCell>
            <TableCell>
              {getMovementTypeBadge(movement.type)}
            </TableCell>
            <TableCell className="max-w-xs truncate">
              {movement.notes || "Sin notas"}
            </TableCell>
            <TableCell>
              {movement.user ? (
                <div className="text-sm">
                  <div className="font-medium">
                    {movement.user.firstName} {movement.user.lastName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {movement.user.email}
                  </div>
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">
                  Sistema
                </span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Componente para la pestaña de Ventas
function SalesTable({ sales }: { sales: any[] }) {
  if (!sales || sales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No hay ventas registradas</h3>
        <p className="text-muted-foreground mt-1 max-w-md">
          No se encontraron órdenes de venta en el sistema.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>ID de Venta</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Productos</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Usuario</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sales.map((sale) => (
          <TableRow key={sale.id}>
            <TableCell className="whitespace-nowrap">
              {formatDateTime(sale.date)}
            </TableCell>
            <TableCell className="font-medium">
              {sale.id.slice(-8)}
            </TableCell>
            <TableCell>
              {formatCurrency(sale.total)}
            </TableCell>
            <TableCell>
              {sale.transactions.length} productos
              <div className="text-xs text-muted-foreground">
                {sale.transactions.reduce((sum: number, t: any) => sum + t.quantity, 0)} unidades
              </div>
            </TableCell>
            <TableCell>
              {getSaleStatusBadge(sale.status)}
            </TableCell>
            <TableCell>
              {sale.user ? (
                <div className="text-sm">
                  <div className="font-medium">
                    {sale.user.firstName} {sale.user.lastName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {sale.user.email}
                  </div>
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">
                  Sistema
                </span>
              )}
            </TableCell>
            <TableCell>
              <Button 
                variant="ghost" 
                size="sm" 
                asChild
                className="h-8 px-2"
              >
                <a href={`/inventory/sales/${sale.id}`}>
                  Ver Detalle
                </a>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Función para mostrar el tipo de movimiento
function getMovementTypeBadge(type: string) {
  switch (type) {
    case "STOCK_IN":
      return (
        <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
          Entrada
        </Badge>
      );
    case "STOCK_OUT":
      return (
        <Badge variant="outline" className="border-red-500 text-red-700 bg-red-50">
          Salida
        </Badge>
      );
    case "ADJUSTMENT":
      return (
        <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50">
          Ajuste
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          {type}
        </Badge>
      );
  }
}

// Función para mostrar el estado de la venta
function getSaleStatusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
      return (
        <Badge className="bg-green-500 hover:bg-green-600">
          Completada
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge className="bg-red-500 hover:bg-red-600">
          Cancelada
        </Badge>
      );
    case "PENDING":
      return (
        <Badge className="bg-yellow-500 hover:bg-yellow-600">
          Pendiente
        </Badge>
      );
    default:
      return (
        <Badge>
          {status}
        </Badge>
      );
  }
}

export default function InventoryMovementsClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // States
  const [isLoading, setIsLoading] = useState(true);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
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
  const [activeTab, setActiveTab] = useState<TabState>("all");
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
        
        // Ensure data.data is always an array
        const rawMovements = data?.data || [];
        if (!Array.isArray(rawMovements)) {
          console.error("Invalid movements data received:", rawMovements);
          setMovements([]);
          setPagination({ total: 0, page: 1, limit: 50, totalPages: 0 });
          return;
        }
        
        // Process movements to ensure valid dates
        const processedMovements = rawMovements.map((movement: any) => ({
          ...movement,
          date: ensureValidDate(movement.date)
        }));
        
        setMovements(processedMovements);
        setPagination(data.pagination || { total: 0, page: 1, limit: 50, totalPages: 0 });
      } catch (error) {
        console.error("Error loading movements:", error);
        setMovements([]);
        setPagination({ total: 0, page: 1, limit: 50, totalPages: 0 });
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
        
        // Ensure data is always an array
        const rawPriceHistory = Array.isArray(data) ? data : [];
        if (!Array.isArray(rawPriceHistory)) {
          console.error("Invalid price history data received:", data);
          setPriceHistory([]);
          return;
        }
        
        setPriceHistory(rawPriceHistory);
      } catch (error) {
        console.error("Error loading price history:", error);
        setPriceHistory([]);
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
  
  // Cargar datos cuando cambia la pestaña
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      
      try {
        if (activeTab === "sales") {
          // Cargar ventas
          const data = await getSales();
          setSales(data.sales || []);
        } else {
          // Cargar movimientos
          const data = await getMovements(activeTab);
          // Verificar si la estructura es la correcta
          if (data.data) {
            setMovements(data.data || []);
          } else {
            // Si la respuesta tiene un formato diferente, adaptarla
            setMovements(data.movements || []);
          }
        }
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Error al cargar los datos. Por favor, intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [activeTab]);

  // Manejador para cambiar de pestaña
  const handleTabChange = (tab: string) => {
    setActiveTab(tab as TabState);
  };

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

  // Price History Tab
  const PriceHistoryTab = () => {
    if (isPriceHistoryLoading) {
      return (
        <div className="py-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm text-muted-foreground">Cargando historial de precios...</p>
          </div>
        </div>
      );
    }
    
    // Ensure priceHistory is an array before rendering
    const safeHistory = Array.isArray(priceHistory) ? priceHistory : [];

    if (safeHistory.length === 0) {
      return (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <TrendingDown className="h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium">No hay datos de historial de precios</h3>
          <p className="text-sm text-muted-foreground max-w-md mt-1 mb-6">
            No se encontraron registros de cambios de precios para los filtros seleccionados.
          </p>
          <Button variant="outline" onClick={() => resetFilters()}>
            Limpiar filtros
          </Button>
        </div>
      );
    }

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Precio Anterior</TableHead>
              <TableHead>Nuevo Precio</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Motivo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {safeHistory.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {item.inventoryItem?.name || "Producto desconocido"}
                  <div className="text-xs text-muted-foreground">
                    {item.inventoryItem?.sku || "Sin SKU"}
                  </div>
                </TableCell>
                <TableCell>{formatCurrency(item.previousPrice || 0)}</TableCell>
                <TableCell>{formatCurrency(item.newPrice || 0)}</TableCell>
                <TableCell>
                  {formatDateTime(item.createdAt)}
                </TableCell>
                <TableCell>
                  {item.user ? (
                    <>
                      {item.user.firstName} {item.user.lastName}
                      <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {item.user.email}
                      </div>
                    </>
                  ) : (
                    "Sistema"
                  )}
                </TableCell>
                <TableCell>{item.changeReason || "No especificado"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs 
        defaultValue={activeTab} 
        onValueChange={handleTabChange}
        className="w-full"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
          <TabsList className="mb-4 sm:mb-0">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="in">Entradas</TabsTrigger>
            <TabsTrigger value="out">Salidas</TabsTrigger>
            <TabsTrigger value="adjustment">Ajustes</TabsTrigger>
            <TabsTrigger value="sales">Ventas</TabsTrigger>
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
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <span className="ml-2">Cargando...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">
            {error}
            <Button 
              variant="outline" 
              onClick={() => handleTabChange(activeTab)}
              className="mt-4"
            >
              <RotateCw className="mr-2 h-4 w-4" /> 
              Reintentar
            </Button>
          </div>
        ) : (
          <>
            <TabsContent value="all" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <MovementsTable movements={movements} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="in" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <MovementsTable movements={movements} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="out" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <MovementsTable movements={movements} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="adjustment" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <MovementsTable movements={movements} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="sales" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <SalesTable sales={sales} />
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
} 