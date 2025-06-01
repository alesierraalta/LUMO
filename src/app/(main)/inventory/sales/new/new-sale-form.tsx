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
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Trash2, Plus, ShoppingCart, Search, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

// Definir el tipo para un producto del inventario
type InventoryProduct = {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  category?: {
    id: string;
    name: string;
  };
};

// Definir el tipo para un ítem de la orden de venta
type SaleItem = {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  price: number;
  total: number;
  category?: string;
};

// Definir el tipo para las props del componente
interface NewSaleFormProps {
  products: InventoryProduct[];
  userId: string;
}

export default function NewSaleForm({ products, userId }: NewSaleFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  // Estados del formulario
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [currentProduct, setCurrentProduct] = useState<string>("");
  const [currentQuantity, setCurrentQuantity] = useState<number>(1);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [customerName, setCustomerName] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState<boolean>(false);

  // Filtrar productos según el término de búsqueda
  const filteredProducts = searchQuery 
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;

  // Calcular el total de la orden
  const orderTotal = saleItems.reduce((sum, item) => sum + item.total, 0);
  
  // Actualizar el precio cuando se selecciona un producto
  useEffect(() => {
    if (currentProduct) {
      const product = products.find(p => p.id === currentProduct);
      if (product) {
        setCurrentPrice(product.price);
        setSelectedProduct(product);
      }
    } else {
      setCurrentPrice(0);
      setSelectedProduct(null);
    }
  }, [currentProduct, products]);

  // Agregar un producto a la orden
  const addProductToOrder = () => {
    if (!currentProduct || currentQuantity <= 0) {
      toast({
        title: "Error al agregar producto",
        description: "Selecciona un producto y especifica una cantidad válida.",
        variant: "destructive"
      });
      return;
    }

    const product = products.find(p => p.id === currentProduct);
    if (!product) {
      toast({
        title: "Producto no encontrado",
        description: "El producto seleccionado no existe en el inventario.",
        variant: "destructive"
      });
      return;
    }

    if (currentQuantity > product.quantity) {
      toast({
        title: "Cantidad no disponible",
        description: `Solo hay ${product.quantity} unidades disponibles de este producto.`,
        variant: "destructive"
      });
      return;
    }

    // Verificar si el producto ya está en la orden
    const existingItemIndex = saleItems.findIndex(item => item.productId === currentProduct);
    
    if (existingItemIndex >= 0) {
      // Actualizar la cantidad y total del ítem existente
      const updatedItems = [...saleItems];
      const newQuantity = updatedItems[existingItemIndex].quantity + currentQuantity;
      
      // Verificar disponibilidad con la nueva cantidad total
      if (newQuantity > product.quantity) {
        toast({
          title: "Cantidad no disponible",
          description: `No puedes agregar ${currentQuantity} más. Solo quedan ${product.quantity - updatedItems[existingItemIndex].quantity} unidades disponibles.`,
          variant: "destructive"
        });
        return;
      }
      
      updatedItems[existingItemIndex].quantity = newQuantity;
      updatedItems[existingItemIndex].price = currentPrice;
      updatedItems[existingItemIndex].total = newQuantity * currentPrice;
      
      setSaleItems(updatedItems);
    } else {
      // Agregar nuevo ítem a la orden
      const newItem: SaleItem = {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: currentQuantity,
        price: currentPrice,
        total: currentQuantity * currentPrice,
        category: product.category?.name
      };
      
      setSaleItems([...saleItems, newItem]);
    }
    
    // Limpiar selección actual
    setCurrentProduct("");
    setCurrentQuantity(1);
    setCurrentPrice(0);
    setSelectedProduct(null);
    setIsProductDialogOpen(false);
  };

  // Eliminar un ítem de la orden
  const removeItem = (index: number) => {
    const updatedItems = [...saleItems];
    updatedItems.splice(index, 1);
    setSaleItems(updatedItems);
  };

  // Procesar la orden de venta
  const processSaleOrder = async () => {
    if (saleItems.length === 0) {
      toast({
        title: "No hay productos",
        description: "Agrega al menos un producto a la orden de venta.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/inventory/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: saleItems,
          notes,
          userId,
          total: orderTotal
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al procesar la orden de venta");
      }

      const data = await response.json();
      
      toast({
        title: "Orden de venta creada",
        description: `La orden de venta #${data.id.slice(-8)} ha sido procesada con éxito.`,
      });

      // Redireccionar a la página de detalle de la venta
      router.push(`/inventory/sales/${data.id}`);
      
    } catch (error) {
      console.error("Error al procesar la orden de venta:", error);
      toast({
        title: "Error al procesar la orden",
        description: error instanceof Error ? error.message : "Ocurrió un error al procesar la orden de venta.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Selección de Productos</CardTitle>
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
                    <DialogTitle>Agregar Producto a la Orden</DialogTitle>
                    <DialogDescription>
                      Selecciona un producto y especifica la cantidad y precio.
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
                        <div><strong>Disponible:</strong> {selectedProduct.quantity} unidades</div>
                        <div><strong>Precio:</strong> {formatCurrency(selectedProduct.price)}</div>
                        {selectedProduct.category && (
                          <div><strong>Categoría:</strong> {selectedProduct.category.name}</div>
                        )}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Cantidad</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          max={selectedProduct?.quantity || 1}
                          value={currentQuantity}
                          onChange={(e) => setCurrentQuantity(Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price">Precio Unitario</Label>
                        <Input
                          id="price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={currentPrice}
                          onChange={(e) => setCurrentPrice(Number(e.target.value))}
                        />
                      </div>
                    </div>
                    
                    {selectedProduct && currentQuantity > 0 && currentPrice > 0 && (
                      <div className="text-right font-semibold">
                        Total: {formatCurrency(currentQuantity * currentPrice)}
                      </div>
                    )}
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsProductDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={addProductToOrder} disabled={!currentProduct || currentQuantity <= 0}>
                      Agregar a la Orden
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            {/* Tabla de productos seleccionados */}
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Precio Unitario</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {saleItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No hay productos agregados a la orden.
                      </TableCell>
                    </TableRow>
                  ) : (
                    saleItems.map((item, index) => (
                      <TableRow key={`${item.productId}-${index}`}>
                        <TableCell>
                          <div className="font-medium">{item.productName}</div>
                          <div className="text-xs text-muted-foreground">
                            SKU: {item.sku} {item.category && `| Categoría: ${item.category}`}
                          </div>
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.price)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(item.total)}</TableCell>
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
                  
                  {/* Fila de totales */}
                  {saleItems.length > 0 && (
                    <TableRow className="border-t-2">
                      <TableCell colSpan={3} className="text-right font-bold">
                        Total de la Orden:
                      </TableCell>
                      <TableCell className="font-bold text-lg">
                        {formatCurrency(orderTotal)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Información adicional de la venta */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customerName">Nombre del Cliente</Label>
                  <Input
                    id="customerName"
                    placeholder="Cliente General"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="notes">Notas de la Venta</Label>
                  <Input
                    id="notes"
                    placeholder="Información adicional sobre la venta..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex flex-col justify-end space-y-4">
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>{formatCurrency(orderTotal)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
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
            onClick={processSaleOrder}
            disabled={saleItems.length === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <>Procesando...</>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                <span>Procesar Orden de Venta</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 