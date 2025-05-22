"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, ChevronUpIcon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, formatPercentage } from "@/lib/utils";

interface PriceHistoryRecord {
  id: string;
  oldPrice: number | null;
  newPrice: number | null;
  oldCost: number | null;
  newCost: number | null;
  oldMargin: number | null;
  newMargin: number | null;
  changeReason: string | null;
  createdAt: string;
  user?: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}

interface PriceHistoryProps {
  productId: string;
}

export default function PriceHistory({ productId }: PriceHistoryProps) {
  const [priceHistory, setPriceHistory] = useState<PriceHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchPriceHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/inventory/${productId}/price-history`);
        
        if (!response.ok) {
          throw new Error("Error fetching price history");
        }
        
        const data = await response.json();
        setPriceHistory(data);
      } catch (err) {
        console.error("Error fetching price history:", err);
        setError("No se pudo cargar el historial de precios");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (productId) {
      fetchPriceHistory();
    }
  }, [productId]);

  // Only show the 3 most recent changes when not expanded
  const displayedHistory = expanded ? priceHistory : priceHistory.slice(0, 3);
  const hasMoreHistory = priceHistory.length > 3;

  // Helper function to display price/cost changes with coloring
  const renderPriceChange = (oldValue: number | null, newValue: number | null) => {
    if (oldValue === null || newValue === null) return "N/A";
    
    const change = newValue - oldValue;
    const changeClass = change > 0 
      ? "text-green-600 font-medium" 
      : change < 0 
        ? "text-red-600 font-medium" 
        : "";
    
    return (
      <div>
        <span>{formatCurrency(newValue)}</span>
        {change !== 0 && (
          <span className={changeClass}>
            {" "}({change > 0 ? "+" : ""}{formatCurrency(change)})
          </span>
        )}
      </div>
    );
  };

  // Helper function to display margin changes with coloring
  const renderMarginChange = (oldValue: number | null, newValue: number | null) => {
    if (oldValue === null || newValue === null) return "N/A";
    
    const change = newValue - oldValue;
    const changeClass = change > 0 
      ? "text-green-600 font-medium" 
      : change < 0 
        ? "text-red-600 font-medium" 
        : "";
    
    return (
      <div>
        <span>{formatPercentage(newValue)}</span>
        {change !== 0 && (
          <span className={changeClass}>
            {" "}({change > 0 ? "+" : ""}{formatPercentage(change, true)})
          </span>
        )}
      </div>
    );
  };

  // Get user name from history record
  const getUserName = (record: PriceHistoryRecord) => {
    if (!record.user) return (
      <span className="text-muted-foreground">Sistema</span>
    );
    
    return (
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
    );
  };

  if (isLoading) {
    return (
      <Card className="w-full mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Historial de Precios</CardTitle>
          <CardDescription>
            Cargando historial de cambios de precios...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Historial de Precios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-md bg-destructive/20 text-destructive">
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (priceHistory.length === 0) {
    return (
      <Card className="w-full mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Historial de Precios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-md bg-muted">
            <p className="text-muted-foreground">No hay cambios de precios registrados para este producto.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Historial de Precios</CardTitle>
        <CardDescription>
          Registro de cambios en el precio, costo y margen del producto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Costo</TableHead>
                <TableHead>Margen</TableHead>
                <TableHead>Razón</TableHead>
                <TableHead>Usuario</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedHistory.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{formatDate(new Date(record.createdAt))}</TableCell>
                  <TableCell>{renderPriceChange(record.oldPrice, record.newPrice)}</TableCell>
                  <TableCell>{renderPriceChange(record.oldCost, record.newCost)}</TableCell>
                  <TableCell>{renderMarginChange(record.oldMargin, record.newMargin)}</TableCell>
                  <TableCell>
                    {record.changeReason || <span className="text-muted-foreground">Sin razón especificada</span>}
                  </TableCell>
                  <TableCell>{getUserName(record)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {hasMoreHistory && (
          <div className="mt-4 flex justify-center">
            <Button 
              variant="outline" 
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1"
            >
              {expanded 
                ? <>Mostrar menos <ChevronUpIcon className="h-4 w-4" /></>
                : <>Ver historial completo <ChevronDownIcon className="h-4 w-4" /></>
              }
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 