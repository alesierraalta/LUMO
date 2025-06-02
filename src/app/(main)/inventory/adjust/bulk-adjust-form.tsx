"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { Trash2, Plus, Package, Search, ArrowRight, Filter } from "lucide-react";
import { useRouter } from "next/navigation";

// Definir el tipo para un producto del inventario
type InventoryProduct = {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  minStockLevel?: number;
  location?: string | null;
  category?: {
    id: string;
    name: string;
  };
};

// Definir el tipo para un ítem del ajuste de inventario
type AdjustmentItem = {
  productId: string;
  productName: string;
  sku: string;
  currentQuantity: number;
  newQuantity: number;
  change: number;
  category?: string;
  reason?: string;
};

// Definir el tipo para las props del componente
interface BulkAdjustFormProps {
  products: InventoryProduct[];
  userId: string;
}

export default function BulkAdjustForm({ products, userId }: BulkAdjustFormProps) {
  const router = useRouter();
  
  // Estados del formulario
  const [adjustmentItems, setAdjustmentItems] = useState<AdjustmentItem[]>([]);
  const [currentProduct, setCurrentProduct] = useState<string>("");
  const [currentQuantity, setCurrentQuantity] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");

  // Filtrar productos según el término de búsqueda
  const filteredProducts = searchQuery 
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;
  
  // Actualizar la información cuando se selecciona un producto
  useEffect(() => {
    if (currentProduct) {
      const product = products.find(p => p.id === currentProduct);
      if (product) {
        setSelectedProduct(product);
        setCurrentQuantity(product.quantity); // Inicializar con la cantidad actual
      }
    } else {
      setSelectedProduct(null);
      setCurrentQuantity(0);
    }
  }, [currentProduct, products]);

  // Agregar un producto al ajuste
  const addProductToAdjustment = () => {
    if (!currentProduct) {
      toast.error("Error al agregar producto", {
        description: "Selecciona un producto para ajustar."
      });
      return;
    }

    if (currentQuantity < 0) {
      toast.error("Cantidad inválida", {
        description: "La cantidad no puede ser negativa."
      });
      return;
    }

    const product = products.find(p => p.id === currentProduct);
    if (!product) {
      toast.error("Producto no encontrado", {
        description: "El producto seleccionado no existe en el inventario."
      });
      return;
    }

    // Verificar si el producto ya está en el ajuste
    const existingItemIndex = adjustmentItems.findIndex(item => item.productId === currentProduct);
    
    if (existingItemIndex >= 0) {
      toast.error("Producto ya agregado", {
        description: "Este producto ya está en la lista de ajustes. Elimínalo primero si deseas cambiarlo."
      });
      return;
    } else {
      // Agregar nuevo ítem al ajuste
      const newItem: AdjustmentItem = {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        currentQuantity: product.quantity,
        newQuantity: currentQuantity,
        change: currentQuantity - product.quantity,
        category: product.category?.name,
        reason: adjustmentReason
      };
      
      setAdjustmentItems([...adjustmentItems, newItem]);
    }
    
    // Limpiar selección actual
    setCurrentProduct("");
    setCurrentQuantity(0);
    setAdjustmentReason("");
    setSelectedProduct(null);
    setIsProductDialogOpen(false);
  };

  // Eliminar un ítem del ajuste
  const removeItem = (index: number) => {
    const updatedItems = [...adjustmentItems];
    updatedItems.splice(index, 1);
    setAdjustmentItems(updatedItems);
  };

  // Procesar el ajuste de inventario
  const processInventoryAdjustment = async () => {
    if (adjustmentItems.length === 0) {
      toast.error("No hay productos", {
        description: "Agrega al menos un producto para ajustar."
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/inventory/bulk-adjust", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: adjustmentItems,
          userId,
          notes
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al procesar el ajuste de inventario");
      }

      const data = await response.json();
      
      toast.success("Ajuste de inventario completado", {
        description: `Se han ajustado ${adjustmentItems.length} productos con éxito.`
      });

      // Redireccionar al inventario
      router.push("/inventory");
      
    } catch (error) {
      console.error("Error al procesar el ajuste de inventario:", error);
      toast.error("Error al procesar el ajuste", {
        description: error instanceof Error ? error.message : "Ocurrió un error al procesar el ajuste de inventario."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ajuste Múltiple de Inventario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            {/* Búsqueda de productos */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar producto por nombre o SKU..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span>Agregar Producto</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajustar Producto de Inventario</DialogTitle>
                    <DialogDescription>
                      Selecciona un producto y especifica la nueva cantidad.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="product">Producto</Label>
                      <Select
                        value={currentProduct}
                        onValueChange={setCurrentProduct}
                      >
                        <SelectTrigger id="product">
                          <SelectValue placeholder="Seleccionar producto" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredProducts.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} ({product.sku})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {selectedProduct && (
                      <div className="p-3 rounded-md bg-muted text-sm">
                        <div><strong>SKU:</strong> {selectedProduct.sku}</div>
                        <div><strong>Cantidad Actual:</strong> {selectedProduct.quantity} unidades</div>
                        <div><strong>Nivel Mínimo:</strong> {selectedProduct.minStockLevel || 0} unidades</div>
                        {selectedProduct.category && (
                          <div><strong>Categoría:</strong> {selectedProduct.category.name}</div>
                        )}
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Nueva Cantidad Total</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="0"
                        value={currentQuantity}
                        onChange={(e) => setCurrentQuantity(Number(e.target.value))}
                      />
                      {selectedProduct && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Cambio: <span className={currentQuantity > selectedProduct.quantity ? "text-green-600" : currentQuantity < selectedProduct.quantity ? "text-red-600" : ""}>
                            {currentQuantity > selectedProduct.quantity ? "+" : ""}
                            {currentQuantity - selectedProduct.quantity} unidades
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reason">Motivo del Ajuste</Label>
                      <Input
                        id="reason"
                        placeholder="Ej: Inventario físico, Merma, Error de registro..."
                        value={adjustmentReason}
                        onChange={(e) => setAdjustmentReason(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsProductDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={addProductToAdjustment} disabled={!currentProduct}>
                      Agregar al Ajuste
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            {/* Tabla de productos a ajustar */}
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Cantidad Actual</TableHead>
                    <TableHead>Nueva Cantidad</TableHead>
                    <TableHead>Cambio</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adjustmentItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No hay productos agregados para ajustar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    adjustmentItems.map((item, index) => (
                      <TableRow key={`${item.productId}-${index}`}>
                        <TableCell>
                          <div className="font-medium">{item.productName}</div>
                          <div className="text-xs text-muted-foreground">
                            SKU: {item.sku} {item.category && `| Categoría: ${item.category}`}
                          </div>
                        </TableCell>
                        <TableCell>{item.currentQuantity}</TableCell>
                        <TableCell>{item.newQuantity}</TableCell>
                        <TableCell>
                          <span className={item.change > 0 ? "text-green-600 font-medium" : item.change < 0 ? "text-red-600 font-medium" : ""}>
                            {item.change > 0 ? "+" : ""}{item.change}
                          </span>
                        </TableCell>
                        <TableCell>{item.reason || "-"}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeItem(index)}
                            className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Notas generales del ajuste */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas Generales del Ajuste</Label>
              <Textarea
                id="notes"
                placeholder="Agrega información general sobre este ajuste de inventario..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
          <Button 
            className="flex items-center gap-2"
            onClick={processInventoryAdjustment}
            disabled={adjustmentItems.length === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <>Procesando...</>
            ) : (
              <>
                <Filter className="h-4 w-4" />
                <span>Procesar Ajuste de Inventario</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 