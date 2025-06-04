'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
  quantity: number;
  categoryName: string;
  createdAt: string;
}

interface DuplicateGroup {
  name: string;
  products: Product[];
  selected: string;
}

export function DuplicateDetector() {
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [hasMerged, setHasMerged] = useState(false);
  const { toast } = useToast();

  const scanForDuplicates = async () => {
    setIsScanning(true);
    try {
      const response = await fetch('/api/inventory/scan-duplicates');
      
      if (!response.ok) {
        throw new Error('Error scanning for duplicates');
      }
      
      const data = await response.json();
      
      // Initialize duplicate groups with the first product selected by default
      const groups = data.duplicates.map((group: any) => ({
        name: group.name,
        products: group.products,
        selected: group.products[0].id,
      }));
      
      setDuplicates(groups);
      
      toast({
        title: "Escaneo completado",
        description: `Se encontraron ${data.duplicates.length} grupos de productos duplicados.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Ocurrió un error al escanear duplicados.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectProduct = (groupIndex: number, productId: string) => {
    setDuplicates(prev => {
      const updated = [...prev];
      updated[groupIndex].selected = productId;
      return updated;
    });
  };

  const mergeDuplicates = async () => {
    if (duplicates.length === 0) return;
    
    setIsLoading(true);
    try {
      // Prepare data for merge
      const mergeData = duplicates.map(group => ({
        name: group.name,
        keepProductId: group.selected,
        mergeProductIds: group.products
          .filter(p => p.id !== group.selected)
          .map(p => p.id)
      }));
      
      // Send merge request
      const response = await fetch('/api/inventory/merge-duplicates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mergeData }),
      });
      
      if (!response.ok) {
        throw new Error('Error merging duplicates');
      }
      
      const result = await response.json();
      
      toast({
        title: "Duplicados resueltos",
        description: `Se han combinado ${result.mergedCount} productos duplicados.`,
      });
      
      // Clear duplicates after merge
      setDuplicates([]);
      setHasMerged(true);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Ocurrió un error al combinar duplicados.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Detector de duplicados</CardTitle>
        <CardDescription>
          Encuentra y soluciona productos duplicados en el inventario
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasMerged && (
          <Alert className="mb-4">
            <AlertTitle>Duplicados resueltos</AlertTitle>
            <AlertDescription>
              Los productos duplicados se han combinado exitosamente. Puedes realizar otro escaneo para verificar si hay más duplicados.
            </AlertDescription>
          </Alert>
        )}
        
        {duplicates.length > 0 ? (
          <div className="space-y-8">
            {duplicates.map((group, groupIndex) => (
              <div key={group.name} className="border rounded-md p-4">
                <h3 className="font-medium text-lg mb-2">
                  Duplicados: "{group.name}" ({group.products.length})
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Selecciona el producto que deseas mantener. Los datos de los otros productos se combinarán con el seleccionado.
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Mantener</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="text-right">Costo</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead>Creado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.products.map(product => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <Checkbox
                            checked={group.selected === product.id}
                            onCheckedChange={() => handleSelectProduct(groupIndex, product.id)}
                          />
                        </TableCell>
                        <TableCell>{product.sku}</TableCell>
                        <TableCell>{product.categoryName}</TableCell>
                        <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${product.cost.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{product.quantity}</TableCell>
                        <TableCell>{new Date(product.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <p className="text-center text-muted-foreground">
              Escanea el inventario para encontrar productos duplicados.
            </p>
            <Button 
              onClick={scanForDuplicates} 
              disabled={isScanning}
            >
              {isScanning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Escaneando...
                </>
              ) : (
                "Escanear duplicados"
              )}
            </Button>
          </div>
        )}
      </CardContent>
      {duplicates.length > 0 && (
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setDuplicates([])}>
            Cancelar
          </Button>
          <Button 
            onClick={mergeDuplicates}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              "Combinar duplicados"
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

export default DuplicateDetector; 