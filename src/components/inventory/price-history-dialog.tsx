"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { History, ArrowUp, ArrowDown, Minus } from "lucide-react";

interface PriceHistoryRecord {
  id: string;
  createdAt: string;
  oldPrice: number | null;
  newPrice: number | null;
  oldCost: number | null;
  newCost: number | null;
  oldMargin: number | null;
  newMargin: number | null;
  changeReason: string | null;
  user?: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}

interface PriceHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventoryItemId: string;
  itemName: string;
}

export default function PriceHistoryDialog({
  open,
  onOpenChange,
  inventoryItemId,
  itemName
}: PriceHistoryDialogProps) {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<PriceHistoryRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && inventoryItemId) {
      fetchHistory();
    }
  }, [open, inventoryItemId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/inventory/${inventoryItemId}/price-history`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch price history");
      }
      
      const data = await response.json();
      setHistory(data);
    } catch (err) {
      console.error("Error fetching price history:", err);
      setError("No se pudo cargar el historial de precios");
    } finally {
      setLoading(false);
    }
  };

  const renderChangeIndicator = (oldValue: number | null, newValue: number | null) => {
    if (oldValue === null || newValue === null) return <Minus className="h-4 w-4" />;
    
    if (newValue > oldValue) {
      return <ArrowUp className="h-4 w-4 text-red-500" />;
    } else if (newValue < oldValue) {
      return <ArrowDown className="h-4 w-4 text-green-500" />;
    }
    
    return <Minus className="h-4 w-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Precios y Costos
          </DialogTitle>
          <DialogDescription>
            Historial de cambios de precio y costo para: <span className="font-semibold">{itemName}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Cargando historial...</div>
          ) : error ? (
            <div className="py-8 text-center text-red-500">{error}</div>
          ) : history.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No hay historial de cambios de precio o costo.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Precio Anterior</TableHead>
                  <TableHead>Precio Nuevo</TableHead>
                  <TableHead>Costo Anterior</TableHead>
                  <TableHead>Costo Nuevo</TableHead>
                  <TableHead>Margen Anterior</TableHead>
                  <TableHead>Margen Nuevo</TableHead>
                  <TableHead>Razón</TableHead>
                  <TableHead>Usuario</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="whitespace-nowrap">{formatDate(record.createdAt)}</TableCell>
                    <TableCell>{record.oldPrice !== null ? formatCurrency(record.oldPrice) : "-"}</TableCell>
                    <TableCell className="flex items-center gap-1">
                      {record.newPrice !== null ? formatCurrency(record.newPrice) : "-"}
                      {renderChangeIndicator(record.oldPrice, record.newPrice)}
                    </TableCell>
                    <TableCell>{record.oldCost !== null ? formatCurrency(record.oldCost) : "-"}</TableCell>
                    <TableCell className="flex items-center gap-1">
                      {record.newCost !== null ? formatCurrency(record.newCost) : "-"}
                      {renderChangeIndicator(record.oldCost, record.newCost)}
                    </TableCell>
                    <TableCell>{record.oldMargin !== null ? `${record.oldMargin}%` : "-"}</TableCell>
                    <TableCell className="flex items-center gap-1">
                      {record.newMargin !== null ? `${record.newMargin}%` : "-"}
                      {renderChangeIndicator(record.oldMargin, record.newMargin)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={record.changeReason || ""}>
                      {record.changeReason || "-"}
                    </TableCell>
                    <TableCell>
                      {record.user 
                        ? (
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
                          )
                        : <span className="text-muted-foreground">Sistema</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 