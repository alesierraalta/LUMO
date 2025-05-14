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
import { ArrowUp, ArrowDown, RotateCw, Clipboard, CalendarRange, Filter, Loader2 } from "lucide-react";
import { formatDate, formatDateTime, ensureValidDate, startOfDay, endOfDay } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale/es";

const MOVEMENT_TYPES = [
  { value: "", label: "Todos los tipos" },
  { value: "STOCK_IN", label: "Entradas" },
  { value: "STOCK_OUT", label: "Salidas" },
  { value: "ADJUSTMENT", label: "Ajustes" },
  { value: "INITIAL", label: "Iniciales" }
];

export default function MovementsClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // States
  const [isLoading, setIsLoading] = useState(true);
  const [movements, setMovements] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, totalPages: 0 });
  
  // Filter states
  const [type, setType] = useState(searchParams.get("type") || "");
  const [startDate, setStartDate] = useState<Date | undefined>(
    searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined
  );
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Load movements based on current filters
  useEffect(() => {
    async function loadMovements() {
      setIsLoading(true);
      
      try {
        // Build query string
        const params = new URLSearchParams();
        if (type) params.append("type", type);
        if (startDate) params.append("startDate", startDate.toISOString());
        if (endDate) params.append("endDate", endDate.toISOString());
        
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
  }, [type, startDate, endDate]);
  
  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Update or remove params based on filter values
    if (type) params.set("type", type);
    else params.delete("type");
    
    if (startDate) params.set("startDate", startDate.toISOString());
    else params.delete("startDate");
    
    if (endDate) params.set("endDate", endDate.toISOString());
    else params.delete("endDate");
    
    // Update URL without causing a navigation
    const newUrl = `${pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  }, [type, startDate, endDate, pathname, router, searchParams]);
  
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
    setType("");
    setStartDate(undefined);
    setEndDate(undefined);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex flex-wrap gap-2">
          <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
                {(type || startDate || endDate) && (
                  <Badge className="ml-1 bg-primary">{(type ? 1 : 0) + (startDate || endDate ? 1 : 0)}</Badge>
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
          
          {/* Active filters display */}
          {(type || startDate || endDate) && (
            <div className="flex flex-wrap gap-2 items-center">
              {type && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Tipo: {MOVEMENT_TYPES.find(t => t.value === type)?.label}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-4 w-4 ml-1 p-0" 
                    onClick={() => setType("")}
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
            </div>
          )}
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : movements.length === 0 ? (
        <div className="text-center p-8 border rounded-md bg-muted/10">
          <p className="text-muted-foreground">No hay movimientos que coincidan con los filtros aplicados</p>
          {(type || startDate || endDate) && (
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
                      movement.inventoryItem.category.name
                    ) : (
                      <Badge variant="outline" className="text-xs">Sin categoría</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {typeInfo.icon}
                      <span className={typeInfo.color}>{typeInfo.label}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {movement.quantity}
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