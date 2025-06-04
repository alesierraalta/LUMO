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
  ArrowUpCircle,
  ArrowDownCircle,
  ShoppingCart,
  PackageOpen,
  ArrowUpDown
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
import { ScrollArea } from "@/components/ui/scroll-area";
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
    
    // Construir los parámetros de la consulta
    const searchParams = new URLSearchParams();
    searchParams.append("type", apiType);
    
    // Agregar otros filtros si están disponibles (serán pasados como argumentos adicionales)
    const url = `/api/inventory/movements?${searchParams.toString()}`;
    console.log("Fetching movements from:", url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error al cargar los movimientos: ${response.status}`);
    }
    const data = await response.json();
    
    console.log("Movements data received:", data);
    
    // Compatibilidad con diferentes formatos de respuesta
    if (data.data) {
      return { data: data.data, pagination: data.pagination };
    } else if (data.movements) {
      return { data: data.movements, pagination: { total: data.movements.length, page: 1, limit: 50, totalPages: 1 } };
    } else if (Array.isArray(data)) {
      return { data: data, pagination: { total: data.length, page: 1, limit: 50, totalPages: 1 } };
    }
    
    return { data: [], pagination: { total: 0, page: 1, limit: 50, totalPages: 0 } };
  } catch (error) {
    console.error("Error fetching movements:", error);
    return { data: [], pagination: { total: 0, page: 1, limit: 50, totalPages: 0 } };
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
                {movement.inventoryItem?.name || "Producto no disponible"}
              </div>
              <div className="text-xs text-muted-foreground">
                SKU: {movement.inventoryItem?.sku || "N/A"}
              </div>
              {movement.inventoryItem?.locationRelation && (
                <div className="text-xs text-muted-foreground flex items-center mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 mr-1"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  {movement.inventoryItem.locationRelation.name}
                </div>
              )}
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
        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
          <ArrowUp className="mr-1 h-3 w-3" />
          Entrada
        </Badge>
      );
    case "STOCK_OUT":
      return (
        <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
          <ArrowDown className="mr-1 h-3 w-3" />
          Salida
        </Badge>
      );
    case "ADJUSTMENT":
      return (
        <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
          <RotateCw className="mr-1 h-3 w-3" />
          Ajuste
        </Badge>
      );
    case "INITIAL":
      return (
        <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
          <Clipboard className="mr-1 h-3 w-3" />
          Inicial
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [isPriceHistoryLoading, setIsPriceHistoryLoading] = useState<boolean>(false);
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
  const [activeTab, setActiveTab] = useState<TabState>(searchParams.get("tab") as TabState || "all");
  const [sales, setSales] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Estados para filtros específicos
  const [saleStatus, setSaleStatus] = useState<string>("all");
  const [priceChangeType, setPriceChangeType] = useState<string>("all");
  
  // Diagnóstico y validación de filtros
  const validateTabFilters = (tab: TabState) => {
    console.group("[DIAGNÓSTICO] VALIDACIÓN DE FILTROS");
    console.log(`[DIAGNÓSTICO] Pestaña activa: ${tab}`);
    
    // Verificar coherencia entre pestaña y tipo de movimiento
    let tipoEsperado = "";
    switch(tab) {
      case "in":
        tipoEsperado = "STOCK_IN";
        break;
      case "out": 
        tipoEsperado = "STOCK_OUT";
        break;
      case "adjustment":
        tipoEsperado = "ADJUSTMENT";
        break;
    }
    
    if (tipoEsperado && type !== tipoEsperado) {
      console.warn(`[DIAGNÓSTICO] INCONSISTENCIA: Tipo ${type} no coincide con el esperado ${tipoEsperado} para la pestaña ${tab}`);
    } else if (tipoEsperado) {
      console.log(`[DIAGNÓSTICO] OK: Tipo ${type} coincide con el esperado para la pestaña ${tab}`);
    }
    
    // Verificar filtros específicos por pestaña
    if (tab === "sales") {
      console.log("[DIAGNÓSTICO] Filtros de ventas:", { saleStatus });
      if (saleStatus !== "all" && !shouldShowSalesFilters()) {
        console.warn("[DIAGNÓSTICO] ADVERTENCIA: Filtro de estado de venta activo pero no visible");
      }
    } else if (tab === "price") {
      console.log("[DIAGNÓSTICO] Filtros de historial de precios:", { priceChangeType });
      if (priceChangeType !== "all" && !shouldShowPriceHistoryFilters()) {
        console.warn("[DIAGNÓSTICO] ADVERTENCIA: Filtro de tipo de cambio activo pero no visible");
      }
    }
    
    // Verificar filtros comunes
    console.log("[DIAGNÓSTICO] Filtros comunes:", {
      startDate: startDate?.toISOString() || "ninguno",
      endDate: endDate?.toISOString() || "ninguno",
      searchQuery: searchQuery || "ninguno",
      categoryId: categoryId || "todos",
      sort
    });
    
    // Verificar disponibilidad de categorías
    console.log("[DIAGNÓSTICO] Categorías disponibles:", {
      total: categories.length,
      ejemplos: categories.slice(0, 3).map(c => c.name)
    });
    
    // Verificar visibilidad de filtros
    console.log("[DIAGNÓSTICO] Visibilidad de filtros:", {
      movementTypeVisible: shouldShowMovementTypeFilter(),
      salesFiltersVisible: shouldShowSalesFilters(),
      priceHistoryFiltersVisible: shouldShowPriceHistoryFilters()
    });
    
    console.groupEnd();
  };
  
  // Función para determinar si mostrar el filtro de tipo de movimiento
  const shouldShowMovementTypeFilter = () => {
    const result = activeTab === "all";
    console.log("[DEBUG] Mostrar filtro tipo movimiento:", result, "| pestaña:", activeTab);
    return result;
  };

  // Función para determinar si mostrar filtros específicos de ventas
  const shouldShowSalesFilters = () => {
    const result = activeTab === "sales";
    console.log("[DEBUG] Mostrar filtros de ventas:", result, "| pestaña:", activeTab);
    return result;
  };

  // Función para determinar si mostrar filtros específicos del historial de precios
  const shouldShowPriceHistoryFilters = () => {
    const result = activeTab === "price";
    console.log("[DEBUG] Mostrar filtros historial precios:", result, "| pestaña:", activeTab);
    return result;
  };

  // Get active filter count
  const getActiveFilterCount = (): number => {
    let count = 0;
    if (type && type !== "all" && shouldShowMovementTypeFilter()) count++;
    if (startDate) count++;
    if (endDate) count++;
    if (categoryId && categoryId !== "all" && activeTab !== "sales") count++;
    if (searchQuery) count++;
    if (sort && sort !== "date-desc") count++;
    if (saleStatus && saleStatus !== "all" && shouldShowSalesFilters()) count++;
    if (priceChangeType && priceChangeType !== "all" && shouldShowPriceHistoryFilters()) count++;
    
    console.log("[DEBUG] Conteo de filtros activos:", count, {
      typeFilter: type && type !== "all" && shouldShowMovementTypeFilter(),
      startDateFilter: !!startDate,
      endDateFilter: !!endDate,
      categoryFilter: categoryId && categoryId !== "all" && activeTab !== "sales",
      searchFilter: !!searchQuery,
      sortFilter: sort && sort !== "date-desc",
      saleStatusFilter: saleStatus && saleStatus !== "all" && shouldShowSalesFilters(),
      priceChangeFilter: priceChangeType && priceChangeType !== "all" && shouldShowPriceHistoryFilters()
    });
    
    return count;
  };

  // Reset filters
  const resetFilters = () => {
    console.log("[DEBUG] Reseteando todos los filtros");
    setType("all");
    setStartDate(undefined);
    setEndDate(undefined);
    setCategoryId("all");
    setSearchQuery("");
    setSort("date-desc");
    setSaleStatus("all");
    setPriceChangeType("all");
    
    // Validar después del reset
    setTimeout(() => validateTabFilters(activeTab), 0);
  };

  // Handle tab changes
  const handleTabChange = (tab: string) => {
    const validTab = tab as TabState;
    console.log("[DEBUG] Cambiando a pestaña:", validTab);
    setActiveTab(validTab);
    
    // Actualizar automáticamente el tipo de movimiento según la pestaña seleccionada
    // pero sin reflejarlo en el parámetro de URL para evitar redundancia
    switch(validTab) {
      case "in":
        setType("STOCK_IN");
        console.log("[DEBUG] Pestaña 'in': estableciendo tipo a STOCK_IN");
        break;
      case "out":
        setType("STOCK_OUT");
        console.log("[DEBUG] Pestaña 'out': estableciendo tipo a STOCK_OUT");
        break;
      case "adjustment":
        setType("ADJUSTMENT");
        console.log("[DEBUG] Pestaña 'adjustment': estableciendo tipo a ADJUSTMENT");
        break;
      case "sales":
        console.log("[DEBUG] Pestaña 'sales': filtros específicos activados");
        break;
      case "price":
        console.log("[DEBUG] Pestaña 'price': filtros específicos activados");
        break;
      default:
        // En la pestaña "all", permitir cualquier tipo
        setType("all");
        console.log("[DEBUG] Pestaña 'all': permitiendo todos los tipos");
        break;
    }

    // Ejecutar validación después del cambio
    setTimeout(() => validateTabFilters(validTab), 0);
  };

  // Apply date range
  const applyDateRange = (range: string) => {
    const now = new Date();
    
    switch(range) {
      case "today":
        setStartDate(startOfDay(now));
        setEndDate(now);
        break;
      case "yesterday":
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        setStartDate(startOfDay(yesterday));
        setEndDate(endOfDay(yesterday));
        break;
      case "thisWeek":
        const firstDayOfWeek = new Date(now);
        firstDayOfWeek.setDate(now.getDate() - now.getDay());
        setStartDate(startOfDay(firstDayOfWeek));
        setEndDate(now);
        break;
      case "thisMonth":
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        setStartDate(startOfDay(firstDayOfMonth));
        setEndDate(now);
        break;
      case "lastMonth":
        const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        setStartDate(startOfDay(firstDayOfLastMonth));
        setEndDate(endOfDay(lastDayOfLastMonth));
        break;
      case "clear":
        setStartDate(undefined);
        setEndDate(undefined);
        break;
    }
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[DEBUG] Búsqueda realizada:", searchQuery);
    // La búsqueda ya está manejada por el useEffect que carga los datos
  };
  
  // Efecto inicial para cargar categorías
  useEffect(() => {
    console.log("[DEBUG] Cargando categorías iniciales");
    loadCategories().catch(err => {
      console.error("[DEBUG] Error en la carga inicial de categorías:", err);
      setCategories([]);
    });
  }, []);

  // Efecto para validar filtros cuando cambian los valores relevantes
  useEffect(() => {
    validateTabFilters(activeTab);
  }, [type, startDate, endDate, categoryId, sort, saleStatus, priceChangeType, activeTab]);

  // Efecto para cargar datos cuando cambian los filtros relevantes
  useEffect(() => {
    // Evitar cargas innecesarias al inicio cuando no hay categorías cargadas
    if (categories.length === 0 && !error) {
      console.log("[DEBUG] Esperando a que se carguen las categorías antes de cargar datos");
      return;
    }
    
    console.group("[DEBUG] Iniciando carga de datos por cambio de filtros");
    console.log("[DEBUG] Estado actual:", {
      activeTab,
      type,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      categoryId,
      searchQuery,
      sort,
      saleStatus,
      priceChangeType,
      categories: categories.length
    });
    
    loadData();
    
    // Validar después de cargar datos
    setTimeout(() => {
      console.log("[DEBUG] Validando filtros después de cargar datos");
      validateTabFilters(activeTab);
    }, 100);
    
    console.groupEnd();
  }, [activeTab, type, startDate, endDate, categoryId, searchQuery, sort, saleStatus, priceChangeType, categories.length, error]);

  // Cargar categorías
  async function loadCategories() {
    try {
      console.log("[DEBUG] Intentando cargar categorías...");
      // Intentar primero con el endpoint principal
      const response = await fetch("/api/categories");
      
      if (!response.ok) {
        console.error(`[DEBUG] Error al cargar categorías: ${response.status} ${response.statusText}`);
        throw new Error(`Error al cargar las categorías: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("[DEBUG] Categorías cargadas:", data);
      
      // Adaptarse a diferentes formatos de respuesta
      if (Array.isArray(data)) {
        console.log("[DEBUG] Formato de categorías: Array");
        setCategories(data);
      } else if (data.categories && Array.isArray(data.categories)) {
        console.log("[DEBUG] Formato de categorías: Objeto con propiedad categories");
        setCategories(data.categories);
      } else {
        console.warn("[DEBUG] Formato de respuesta de categorías inesperado:", data);
        // Si el formato no es reconocido, intentar extraer categorías de cualquier modo
        if (data && typeof data === 'object') {
          const categoriesArray = Object.values(data).find(value => 
            Array.isArray(value) && value.length > 0 && value[0] && typeof value[0] === 'object' && 'id' in value[0] && 'name' in value[0]
          );
          
          if (categoriesArray && Array.isArray(categoriesArray)) {
            console.log("[DEBUG] Encontrado array de categorías en formato alternativo");
            setCategories(categoriesArray as Array<{id: string, name: string}>);
            return;
          }
        }
        
        setCategories([]);
      }
    } catch (error) {
      console.error("[DEBUG] Error al cargar categorías:", error);
      // Intentar un endpoint alternativo como fallback
      try {
        console.log("[DEBUG] Intentando endpoint alternativo para categorías...");
        const fallbackResponse = await fetch("/api/categories/all");
        
        if (!fallbackResponse.ok) {
          throw new Error(`Error en fallback: ${fallbackResponse.status}`);
        }
        
        const fallbackData = await fallbackResponse.json();
        console.log("[DEBUG] Categorías cargadas desde fallback:", fallbackData);
        
        if (Array.isArray(fallbackData)) {
          setCategories(fallbackData);
        } else if (fallbackData.categories && Array.isArray(fallbackData.categories)) {
          setCategories(fallbackData.categories);
        } else {
          setCategories([]);
        }
      } catch (fallbackError) {
        console.error("[DEBUG] Error en fallback de categorías:", fallbackError);
        // Usar un array vacío para no interrumpir la experiencia
        setCategories([]);
        // Re-lanzar para que el efecto pueda manejar el error
        throw error;
      }
    }
  }

  // Función para cargar datos según los filtros
  async function loadData() {
    try {
      // Establecer todos los estados de carga al inicio
      setIsLoading(true);
      if (activeTab === "price") {
        setIsPriceHistoryLoading(true);
      }
      setError(null);
      
      console.group("[DEBUG] Carga de datos");
      console.log("[DEBUG] Filtros activos:", {
        activeTab,
        type,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        categoryId,
        searchQuery,
        sort,
        saleStatus,
        priceChangeType
      });
      
      if (activeTab === "sales") {
        // Cargar ventas con filtros específicos
        const salesParams = new URLSearchParams();
        
        if (startDate) salesParams.append("startDate", startDate.toISOString());
        if (endDate) salesParams.append("endDate", endDate.toISOString());
        if (searchQuery) salesParams.append("search", searchQuery);
        if (saleStatus && saleStatus !== "all") salesParams.append("status", saleStatus);
        if (sort) salesParams.append("sort", sort);
        
        const salesUrl = `/api/inventory/sales?${salesParams.toString()}`;
        console.log("[DEBUG] Cargando ventas:", salesUrl);
        
        try {
          const response = await fetch(salesUrl);
          
          console.log("[DEBUG] Respuesta de ventas:", {
            status: response.status,
            ok: response.ok
          });
          
          if (!response.ok) {
            throw new Error(`Error al cargar las ventas: ${response.status}`);
          }
          
          const data = await response.json();
          console.log("[DEBUG] Ventas recibidas:", {
            count: data.sales ? data.sales.length : 0,
            muestra: data.sales ? data.sales.slice(0, 2) : []
          });
          
          setSales(data.sales || []);
        } catch (error: any) {
          console.error("[DEBUG] Error al cargar ventas:", error);
          setError(`Error al cargar las ventas: ${error.message || 'Error desconocido'}`);
        } finally {
          // Asegurarnos de que isLoading se establece a false
          setIsLoading(false);
        }
      } else if (activeTab === "price") {
        // Cargar historial de precios con filtros específicos
        const priceParams = new URLSearchParams();
        
        if (categoryId && categoryId !== "all") priceParams.append("categoryId", categoryId);
        if (startDate) priceParams.append("startDate", startDate.toISOString());
        if (endDate) priceParams.append("endDate", endDate.toISOString());
        if (searchQuery) priceParams.append("search", searchQuery);
        if (priceChangeType && priceChangeType !== "all") priceParams.append("changeType", priceChangeType);
        if (sort) priceParams.append("sort", sort);
        
        const priceUrl = `/api/inventory/price-history?${priceParams.toString()}`;
        console.log("[DEBUG] Cargando historial de precios:", priceUrl);
        
        try {
          const response = await fetch(priceUrl);
          
          console.log("[DEBUG] Respuesta de historial de precios:", {
            status: response.status,
            ok: response.ok
          });
          
          if (!response.ok) {
            throw new Error(`Error al cargar el historial de precios: ${response.status}`);
          }
          
          const data = await response.json();
          console.log("[DEBUG] Historial de precios recibido:", {
            formato: Array.isArray(data) ? "array" : "objeto",
            count: Array.isArray(data) ? data.length : (data.data ? data.data.length : 0)
          });
          
          // Ensure data is always an array
          const rawPriceHistory = Array.isArray(data) ? data : (data.data || []);
          setPriceHistory(rawPriceHistory);
        } catch (error: any) {
          console.error("[DEBUG] Error al cargar historial de precios:", error);
          setError(`Error al cargar el historial de precios: ${error.message || 'Error desconocido'}`);
        } finally {
          // Asegurar que ambos estados de carga se establecen a false
          setIsPriceHistoryLoading(false);
          setIsLoading(false);
        }
      } else {
        // Cargar movimientos de inventario normales
        const movementsParams = new URLSearchParams();
        
        // En pestañas específicas, usar el tipo correspondiente
        // En la pestaña "all", usar el tipo seleccionado en el filtro
        if (activeTab === "all" && type && type !== "all") {
          movementsParams.append("type", type);
        } else if (activeTab === "in") {
          movementsParams.append("type", "STOCK_IN");
        } else if (activeTab === "out") {
          movementsParams.append("type", "STOCK_OUT");
        } else if (activeTab === "adjustment") {
          movementsParams.append("type", "ADJUSTMENT");
        }
        
        if (categoryId && categoryId !== "all") movementsParams.append("categoryId", categoryId);
        if (startDate) movementsParams.append("startDate", startDate.toISOString());
        if (endDate) movementsParams.append("endDate", endDate.toISOString());
        if (searchQuery) movementsParams.append("search", searchQuery);
        if (sort) movementsParams.append("sort", sort);
        
        const queryString = movementsParams.toString();
        const movementsUrl = `/api/inventory/movements${queryString ? `?${queryString}` : ''}`;
        console.log("[DEBUG] Cargando movimientos:", movementsUrl);
        
        try {
          const response = await fetch(movementsUrl);
          
          console.log("[DEBUG] Respuesta de movimientos:", {
            status: response.status,
            ok: response.ok
          });
          
          if (!response.ok) {
            throw new Error(`Error de servidor: ${response.status}`);
          }
          
          const data = await response.json();
          console.log("[DEBUG] Datos de movimientos recibidos:", {
            tipo: typeof data,
            formato: Array.isArray(data) ? "array" : "objeto",
            datosMuestra: Array.isArray(data) 
              ? data.slice(0, 2) 
              : data.data 
                ? data.data.slice(0, 2) 
                : data.movements 
                  ? data.movements.slice(0, 2) 
                  : "formato desconocido"
          });
          
          // Adaptar el formato de datos según la respuesta
          if (data.data) {
            setMovements(data.data);
            setPagination(data.pagination || { total: data.data.length, page: 1, limit: 50, totalPages: 1 });
          } else if (data.movements) {
            setMovements(data.movements);
            setPagination(data.pagination || { total: data.movements.length, page: 1, limit: 50, totalPages: 1 });
          } else if (Array.isArray(data)) {
            setMovements(data);
            setPagination({ total: data.length, page: 1, limit: 50, totalPages: 1 });
          } else {
            console.error("[DEBUG] Formato de datos desconocido:", data);
            setMovements([]);
            setPagination({ total: 0, page: 1, limit: 50, totalPages: 0 });
          }
        } catch (error: any) {
          console.error("[DEBUG] Error al cargar movimientos:", error);
          setError(`Error al cargar los datos: ${error.message || 'Error desconocido'}`);
        } finally {
          // Asegurar que isLoading se establece a false
          setIsLoading(false);
        }
      }
      
      console.groupEnd();
    } catch (error: any) {
      console.error("[DEBUG] Error general en loadData:", error);
      setError(`Error al cargar los datos: ${error.message || 'Error desconocido'}`);
      // Asegurar que todos los estados de carga se establecen a false incluso en caso de error
      setIsLoading(false);
      setIsPriceHistoryLoading(false);
    }
  }

  // Update URL when filters or active tab changes
  useEffect(() => {
    console.log("[DEBUG] Actualizando URL con filtros:", {
      activeTab,
      type,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      categoryId,
      searchQuery,
      sort,
      saleStatus,
      priceChangeType
    });

    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", activeTab);
    
    // Solo incluir el parámetro type cuando estamos en la pestaña "all"
    if (type && type !== "all" && activeTab === "all") {
      params.set("type", type);
    } else if (activeTab !== "all") {
      // Eliminar el parámetro type si no estamos en la pestaña "all"
      params.delete("type");
    }
    
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

    // Añadir parámetros específicos para ventas y precio
    if (activeTab === "sales" && saleStatus && saleStatus !== "all") {
      params.set("status", saleStatus);
    } else {
      params.delete("status");
    }

    if (activeTab === "price" && priceChangeType && priceChangeType !== "all") {
      params.set("changeType", priceChangeType);
    } else {
      params.delete("changeType");
    }
    
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [type, startDate, endDate, categoryId, searchQuery, sort, activeTab, saleStatus, priceChangeType, pathname, router, searchParams]);

  return (
    <div className="space-y-6">
      <Tabs 
        defaultValue={activeTab} 
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
          <TabsList className="mb-4 sm:mb-0 flex flex-wrap h-auto p-1 bg-muted rounded-lg border border-muted-foreground/10">
            <TabsTrigger 
              value="all" 
              className="rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm px-4 py-2"
            >
              Todos
            </TabsTrigger>
            <TabsTrigger 
              value="in" 
              className="rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm px-4 py-2"
            >
              Entradas
            </TabsTrigger>
            <TabsTrigger 
              value="out" 
              className="rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm px-4 py-2"
            >
              Salidas
            </TabsTrigger>
            <TabsTrigger 
              value="adjustment" 
              className="rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm px-4 py-2"
            >
              Ajustes
            </TabsTrigger>
            <TabsTrigger 
              value="sales" 
              className="rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm px-4 py-2"
            >
              Ventas
            </TabsTrigger>
            <TabsTrigger 
              value="price" 
              className="rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm px-4 py-2"
            >
              Historial de Precios
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className={`relative flex-1 sm:max-w-[300px] transition-all duration-200 ${isSearchFocused ? 'flex-grow' : ''}`}>
              <form onSubmit={handleSearch} className="w-full">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={activeTab === "price" 
                    ? "Buscar historial de precios..." 
                    : activeTab === "sales"
                      ? "Buscar ventas..."
                      : "Buscar movimientos..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className="w-full pl-9 pr-4 border-muted-foreground/20 focus:border-primary"
                />
              </form>
            </div>
            
            <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="relative border-muted-foreground/20 hover:bg-muted">
                  <SlidersHorizontal className="h-4 w-4" />
                  {getActiveFilterCount() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full h-4 w-4 text-[10px] flex items-center justify-center">
                      {getActiveFilterCount()}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-[300px] sm:w-[420px] p-0 shadow-lg border-muted-foreground/10"
                side="bottom" 
                align="end" 
                sideOffset={5}
              >
                <div className="border-b border-muted-foreground/10 px-4 py-3 bg-muted/40 flex items-center justify-between rounded-t-lg">
                  <h4 className="font-medium flex items-center">
                    <Filter className="h-4 w-4 mr-2 text-primary" /> 
                    {activeTab === "sales" 
                      ? "Filtros de ventas" 
                      : activeTab === "price" 
                        ? "Filtros de historial de precios" 
                        : "Filtros de movimientos"}
                  </h4>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 hover:bg-background" 
                    onClick={resetFilters}
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> 
                    Limpiar
                  </Button>
                </div>
                  
                <ScrollArea className="max-h-[calc(80vh-100px)]">
                  <div className="p-4 space-y-5">
                    {/* Filtro de tipo de movimiento - solo en pestaña "Todos" */}
                    {shouldShowMovementTypeFilter() && (
                      <div className="space-y-2">
                        <Label htmlFor="type" className="text-sm font-medium flex items-center">
                          <Tag className="h-3.5 w-3.5 mr-1.5 text-primary" />
                          Tipo de Movimiento
                        </Label>
                        <Select value={type} onValueChange={setType}>
                          <SelectTrigger id="type" className="w-full border-muted-foreground/20">
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

                    {/* Filtros específicos para ventas */}
                    {shouldShowSalesFilters() && (
                      <div className="space-y-2">
                        <Label htmlFor="status" className="text-sm font-medium flex items-center">
                          <Tag className="h-3.5 w-3.5 mr-1.5 text-primary" />
                          Estado de la Venta
                        </Label>
                        <Select value={saleStatus} onValueChange={setSaleStatus}>
                          <SelectTrigger id="status" className="w-full border-muted-foreground/20">
                            <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos los estados</SelectItem>
                            <SelectItem value="completed">Completadas</SelectItem>
                            <SelectItem value="pending">Pendientes</SelectItem>
                            <SelectItem value="cancelled">Canceladas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Filtros específicos para historial de precios */}
                    {shouldShowPriceHistoryFilters() && (
                      <div className="space-y-2">
                        <Label htmlFor="priceChangeType" className="text-sm font-medium flex items-center">
                          <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-primary" />
                          Tipo de Cambio
                        </Label>
                        <Select value={priceChangeType} onValueChange={setPriceChangeType}>
                          <SelectTrigger id="priceChangeType" className="w-full border-muted-foreground/20">
                            <SelectValue placeholder="Seleccionar tipo de cambio" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos los cambios</SelectItem>
                            <SelectItem value="increase">Aumentos</SelectItem>
                            <SelectItem value="decrease">Disminuciones</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Filtro de fechas - común para todas las pestañas */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <CalendarRange className="h-4 w-4 text-primary" />
                        <Label className="text-sm font-medium">Rango de Fechas</Label>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Fecha Inicial</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal border-muted-foreground/20"
                              >
                                <CalendarRange className="mr-2 h-4 w-4" />
                                {startDate ? (
                                  format(startDate, "dd/MM/yyyy")
                                ) : (
                                  <span className="text-muted-foreground">Seleccionar inicio</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start" side="top">
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
                        
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Fecha Final</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal border-muted-foreground/20"
                              >
                                <CalendarRange className="mr-2 h-4 w-4" />
                                {endDate ? (
                                  format(endDate, "dd/MM/yyyy")
                                ) : (
                                  <span className="text-muted-foreground">Seleccionar fin</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start" side="top">
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
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => applyDateRange("today")}
                        className="text-xs h-7 px-2.5 border-muted-foreground/20"
                      >
                        Hoy
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => applyDateRange("yesterday")}
                        className="text-xs h-7 px-2.5 border-muted-foreground/20"
                      >
                        Ayer
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => applyDateRange("thisWeek")}
                        className="text-xs h-7 px-2.5 border-muted-foreground/20"
                      >
                        Esta Semana
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => applyDateRange("thisMonth")}
                        className="text-xs h-7 px-2.5 border-muted-foreground/20"
                      >
                        Este Mes
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => applyDateRange("lastMonth")}
                        className="text-xs h-7 px-2.5 border-muted-foreground/20"
                      >
                        Mes Anterior
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => applyDateRange("clear")}
                        className="text-xs h-7 px-2.5 bg-muted/40 border-muted-foreground/20"
                      >
                        Borrar
                      </Button>
                    </div>
                    
                    {/* Filtro de categoría - común para movimientos e historial de precios */}
                    {activeTab !== "sales" && (
                      <div className="space-y-2">
                        <Label htmlFor="category" className="text-sm font-medium flex items-center">
                          <PackageOpen className="h-3.5 w-3.5 mr-1.5 text-primary" />
                          Categoría
                        </Label>
                        <Select value={categoryId} onValueChange={setCategoryId}>
                          <SelectTrigger id="category" className="w-full border-muted-foreground/20">
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
                    )}
                    
                    {/* Filtro de ordenamiento */}
                    <div className="space-y-2">
                      <Label htmlFor="sort" className="text-sm font-medium flex items-center">
                        <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-primary" />
                        Ordenar por
                      </Label>
                      <Select value={sort} onValueChange={setSort}>
                        <SelectTrigger id="sort" className="w-full border-muted-foreground/20">
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
                  </div>
                </ScrollArea>
                
                <div className="sticky bottom-0 pt-3 px-4 pb-4 flex justify-end border-t border-muted-foreground/10 mt-2 bg-background rounded-b-lg">
                  <Button 
                    onClick={() => setIsFiltersOpen(false)}
                    className="bg-primary hover:bg-primary/90 transition-colors"
                  >
                    <Filter className="h-4 w-4 mr-1.5" />
                    Aplicar Filtros
                  </Button>
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
        
        {/* Agregar un indicador de depuración en modo desarrollo */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-muted-foreground mb-2 p-2 bg-muted/20 rounded">
            Debug: isLoading={String(isLoading)}, isPriceHistoryLoading={String(isPriceHistoryLoading)}, 
            error={error ? "true" : "false"}, activeTab={activeTab}, 
            movementsLength={movements.length}, salesLength={sales.length}, priceHistoryLength={priceHistory.length}
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <span className="ml-2">Cargando...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-500 mb-2">{error}</div>
            <Button 
              variant="outline" 
              onClick={() => {
                console.log("[DEBUG] Reintentando carga de datos...");
                loadData();
              }}
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
            
            <TabsContent value="price" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {isPriceHistoryLoading ? (
                    <div className="py-8 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <p className="text-sm text-muted-foreground">Cargando historial de precios...</p>
                      </div>
                    </div>
                  ) : priceHistory.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                      <ArrowUpDown className="h-12 w-12 text-muted-foreground mb-3" />
                      <h3 className="text-lg font-medium">No hay datos de historial de precios</h3>
                      <p className="text-sm text-muted-foreground max-w-md mt-1 mb-6">
                        No se encontraron registros de cambios de precios para los filtros seleccionados.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead>Precio Anterior</TableHead>
                            <TableHead>Nuevo Precio</TableHead>
                            <TableHead>Variación</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Usuario</TableHead>
                            <TableHead>Motivo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {priceHistory.map((item) => {
                            const previousPrice = item.previousPrice || 0;
                            const newPrice = item.newPrice || 0;
                            const variation = previousPrice > 0 
                              ? ((newPrice - previousPrice) / previousPrice) * 100 
                              : 0;
                            
                            return (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">
                                  {item.inventoryItem?.name || "Producto desconocido"}
                                  <div className="text-xs text-muted-foreground">
                                    {item.inventoryItem?.sku || "Sin SKU"}
                                  </div>
                                </TableCell>
                                <TableCell>{formatCurrency(previousPrice)}</TableCell>
                                <TableCell>{formatCurrency(newPrice)}</TableCell>
                                <TableCell>
                                  <span className={`flex items-center ${variation > 0 ? 'text-red-500' : variation < 0 ? 'text-green-500' : 'text-gray-500'}`}>
                                    {variation > 0 ? (
                                      <ArrowUp className="h-4 w-4 mr-1" />
                                    ) : variation < 0 ? (
                                      <ArrowDown className="h-4 w-4 mr-1" />
                                    ) : null}
                                    {variation === 0 ? '0%' : `${variation.toFixed(2)}%`}
                                  </span>
                                </TableCell>
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
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
} 