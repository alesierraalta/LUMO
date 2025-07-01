import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  ArrowRight, 
  ArrowRightLeft, 
  Pencil, 
  Info,
  ChevronRight,
  Package,
  X,
  Check,
  FileStack,
  ListFilter,
  DollarSign,
  Hash,
  Tag,
  Merge,
  Trash2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// Tipos y constantes
// ------------------
const RESOLUTION_TYPES = {
  MERGE: 'merge',
  KEEP: 'keep',
  RENAME: 'rename'
} as const;

const DUPLICATE_TYPES = {
  SKU: 'sku',
  NAME: 'name'
} as const;

// Componentes reutilizables
// ------------------------
interface ItemRadioProps {
  itemId: string;
  groupKey: string;
  selectedId: string;
  onSelect: (value: string) => void;
  isSelected: boolean;
}

const ItemRadio = React.memo(({ 
  itemId, 
  groupKey,
  selectedId, 
  onSelect,
  isSelected
}: ItemRadioProps) => {
  return (
    <div className="relative">
      <RadioGroup
        value={selectedId}
        onValueChange={onSelect}
        className="flex items-center"
      >
        <RadioItem 
          value={itemId} 
          id={`radio-item-${groupKey}-${itemId}`} 
          className="h-6 w-6 border-2 border-muted-foreground/30 data-[state=checked]:border-primary data-[state=checked]:text-primary"
        />
      </RadioGroup>
      {isSelected && (
        <div 
          className="absolute -inset-2 bg-primary/10 rounded-full -z-10 border-2 border-primary/20"
        />
      )}
    </div>
  );
});
ItemRadio.displayName = "ItemRadio";

interface ResolutionOptionProps {
  type: 'merge' | 'keep' | 'rename';
  currentValue: string;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  tooltip: string;
}

const ResolutionOption: React.FC<ResolutionOptionProps> = ({
  type,
  currentValue,
  onClick,
  icon,
  label,
  tooltip
}) => {
  const isActive = currentValue === type;
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Button
            type="button"
            onClick={onClick}
            variant={isActive ? "default" : "outline"}
            size="sm"
            className={cn(
              "flex items-center gap-2 px-4 py-2 h-10 text-sm font-medium transition-all duration-200", 
              isActive 
                ? "bg-primary text-primary-foreground shadow-lg" 
                : "bg-background hover:bg-muted border-2 hover:border-primary/50"
            )}
          >
            <span className="h-4 w-4">{icon}</span>
            <span className="hidden sm:inline">{label}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent 
          side="bottom" 
          className="text-sm bg-popover/95 backdrop-blur-sm border-border max-w-xs"
          sideOffset={8}
        >
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Badge para origen de productos
const OriginBadge = ({ isExisting }: { isExisting: boolean }) => (
  <Badge 
    variant="outline" 
    className={cn(
      "gap-2 px-3 py-1.5 text-sm font-medium rounded-full",
      isExisting 
        ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-600" 
        : "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-600"
    )}
  >
    {isExisting ? (
      <>
        <Package className="h-4 w-4" />
        <span>En Sistema</span>
      </>
    ) : (
      <>
        <FileStack className="h-4 w-4" />
        <span>Excel</span>
      </>
    )}
  </Badge>
);

// Componente de información del producto
const ProductInfo = ({ icon, label, value, highlight = false }: { 
  icon: React.ReactNode, 
  label: string, 
  value: string | number | null,
  highlight?: boolean 
}) => (
  <div className={cn(
    "flex items-center gap-3 p-3 rounded-lg transition-colors",
    highlight ? "bg-primary/5 border border-primary/20" : "bg-muted/30"
  )}>
    <div className="flex items-center gap-2 text-muted-foreground min-w-0 flex-1">
      <span className="h-4 w-4 flex-shrink-0">{icon}</span>
      <span className="text-sm font-medium">{label}:</span>
    </div>
    <span className={cn(
      "font-semibold truncate",
      highlight ? "text-primary" : "text-foreground",
      value === null || value === '-' ? "text-muted-foreground" : ""
    )}>
      {value !== null ? value : '-'}
    </span>
  </div>
);

// Componente principal
// -------------------
interface DuplicateItem {
  id: string;
  rowId: number;
  name: string;
  sku: string;
  price: number | null;
  cost: number | null;
  quantity: number | null;
  category: string | null;
  existingProduct?: boolean;
}

interface DuplicateGroup {
  key: string;
  type: 'sku' | 'name';
  items: DuplicateItem[];
  selectedId: string;
  resolution: 'merge' | 'keep' | 'rename';
}

interface DuplicateResolverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duplicates: {
    skuDuplicates: DuplicateItem[][];
    nameDuplicates: DuplicateItem[][];
  };
  onResolve: (resolutions: DuplicateGroup[]) => void;
}

export function DuplicateResolver({ 
  open, 
  onOpenChange, 
  duplicates, 
  onResolve 
}: DuplicateResolverProps) {
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [autoResolve, setAutoResolve] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>(DUPLICATE_TYPES.SKU);
  
  // Preparar grupos de duplicados cuando cambian los datos
  useEffect(() => {
    if (open && (duplicates.skuDuplicates.length > 0 || duplicates.nameDuplicates.length > 0)) {
      const groups: DuplicateGroup[] = [];
      
      // Procesar duplicados por SKU (prioridad alta)
      duplicates.skuDuplicates.forEach((items, index) => {
        if (items.length > 1) {
          // Ordenar para que los productos existentes estén primero
          const sortedItems = [...items].sort((a, b) => {
            if (a.existingProduct && !b.existingProduct) return -1;
            if (!a.existingProduct && b.existingProduct) return 1;
            return 0;
          });
          
          // Seleccionar por defecto el primer elemento (existente si hay alguno)
          const existingItem = sortedItems.find(item => item.existingProduct);
          const defaultSelected = existingItem?.id || 
                               sortedItems[0]?.id || 
                               `fallback-${index}`;
                               
          groups.push({
            key: `sku-${index}`,
            type: DUPLICATE_TYPES.SKU,
            items: sortedItems,
            selectedId: defaultSelected,
            resolution: RESOLUTION_TYPES.MERGE // Por defecto fusionar para SKUs duplicados
          });
        }
      });
      
      // Procesar duplicados por nombre (prioridad media)
      duplicates.nameDuplicates.forEach((items, index) => {
        if (items.length > 1) {
          // Solo incluir si no hay SKUs duplicados entre estos items
          const skuSet = new Set();
          let hasDuplicateSku = false;
          
          items.forEach(item => {
            if (skuSet.has(item.sku)) {
              hasDuplicateSku = true;
            }
            skuSet.add(item.sku);
          });
          
          // Si no hay duplicados de SKU, agregamos este grupo
          if (!hasDuplicateSku) {
            const sortedItems = [...items].sort((a, b) => {
              if (a.existingProduct && !b.existingProduct) return -1;
              if (!a.existingProduct && b.existingProduct) return 1;
              return 0;
            });
            
            const existingItem = sortedItems.find(item => item.existingProduct);
            const defaultSelected = existingItem?.id || 
                                  sortedItems[0]?.id || 
                                  `fallback-name-${index}`;
                                   
            groups.push({
              key: `name-${index}`,
              type: DUPLICATE_TYPES.NAME,
              items: sortedItems,
              selectedId: defaultSelected,
              resolution: RESOLUTION_TYPES.RENAME // Por defecto renombrar para nombres duplicados
            });
          }
        }
      });
      
      setDuplicateGroups(groups);
      
      // Set default tab based on which type has more duplicates
      const skuCount = groups.filter(g => g.type === DUPLICATE_TYPES.SKU).length;
      const nameCount = groups.filter(g => g.type === DUPLICATE_TYPES.NAME).length;
      setSelectedTab(skuCount >= nameCount ? DUPLICATE_TYPES.SKU : DUPLICATE_TYPES.NAME);
    }
  }, [open, duplicates]);
  
  // Función para manejar la selección de ítem en un grupo
  const handleSelectItem = (groupIndex: number, itemId: string) => {
    setDuplicateGroups(prev => {
      const updated = [...prev];
      // Ensure we have a valid ID
      if (itemId) {
        updated[groupIndex].selectedId = itemId;
      }
      return updated;
    });
  };
  
  // Función para cambiar el tipo de resolución para un grupo
  const handleChangeResolution = (groupIndex: number, resolution: 'merge' | 'keep' | 'rename') => {
    setDuplicateGroups(prev => {
      const updated = [...prev];
      updated[groupIndex].resolution = resolution;
      return updated;
    });
  };
  
  // Función para resolver automáticamente todos los duplicados
  const handleAutoResolve = () => {
    setIsProcessing(true);
    
    setTimeout(() => {
      // Aplicar reglas de resolución automática
      const resolved = duplicateGroups.map(group => {
        // Para duplicados de SKU
        if (group.type === DUPLICATE_TYPES.SKU) {
          // Si hay un producto existente, lo mantenemos y fusionamos
          const hasExisting = group.items.some(item => item.existingProduct);
          
          if (hasExisting) {
            // Buscar el ID del producto existente
            const existingId = group.items.find(item => item.existingProduct)?.id;
            return {
              ...group,
              selectedId: existingId || group.selectedId,
              resolution: RESOLUTION_TYPES.MERGE
            };
          } else {
            // Si todos son nuevos, mantener el que tiene más información
            const itemScores = group.items.map(item => {
              let score = 0;
              if (item.price !== null) score += 1;
              if (item.cost !== null) score += 1;
              if (item.quantity !== null) score += 1;
              if (item.category !== null) score += 1;
              return { id: item.id, score };
            });
            
            // Ordenar por puntuación
            itemScores.sort((a, b) => b.score - a.score);
            
            return {
              ...group,
              selectedId: itemScores[0].id,
              resolution: RESOLUTION_TYPES.MERGE
            };
          }
        } 
        // Para duplicados de nombre
        else {
          // Preferir mantener existentes, sino renombrar
          const hasExisting = group.items.some(item => item.existingProduct);
          
          if (hasExisting) {
            const existingId = group.items.find(item => item.existingProduct)?.id;
            return {
              ...group,
              selectedId: existingId || group.selectedId,
              resolution: RESOLUTION_TYPES.KEEP
            };
          } else {
            return {
              ...group,
              resolution: RESOLUTION_TYPES.RENAME
            };
          }
        }
      });
      
      setDuplicateGroups(resolved);
      setIsProcessing(false);
    }, 1000); // Simular procesamiento
  };
  
  // Función para finalizar y aplicar resoluciones
  const handleApplyResolutions = () => {
    onResolve(duplicateGroups);
    onOpenChange(false);
  };

  // Render resolution icon based on resolution type
  const getResolutionIcon = (resolution: 'merge' | 'keep' | 'rename') => {
    switch (resolution) {
      case RESOLUTION_TYPES.MERGE:
        return <ArrowRightLeft className="h-4 w-4" />;
      case RESOLUTION_TYPES.KEEP:
        return <Check className="h-4 w-4" />;
      case RESOLUTION_TYPES.RENAME:
        return <Pencil className="h-4 w-4" />;
    }
  };

  // Get resolution text
  const getResolutionText = (resolution: 'merge' | 'keep' | 'rename') => {
    switch (resolution) {
      case RESOLUTION_TYPES.MERGE:
        return "Combinar información de todos los productos";
      case RESOLUTION_TYPES.KEEP:
        return "Mantener solo el producto seleccionado";
      case RESOLUTION_TYPES.RENAME:
        return "Renombrar productos para evitar conflictos";
    }
  };
  
  // Renderizado de item de producto
  const renderItemRow = (item: DuplicateItem, itemIndex: number, group: DuplicateGroup, groupIndex: number) => {
    const isSelected = item.id === group.selectedId;
    const actualGroupIndex = group.type === DUPLICATE_TYPES.NAME ? 
      duplicateGroups.filter(g => g.type === DUPLICATE_TYPES.SKU).length + groupIndex : 
      groupIndex;
    
    return (
      <div
        key={`row-${group.key}-${itemIndex}-${item.id || item.rowId || itemIndex}`}
        className={cn(
          "relative rounded-xl border-2 p-6 mb-6 last:mb-0 cursor-pointer transition-all duration-300",
          isSelected 
            ? "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20" 
            : "border-border hover:border-primary/40 hover:bg-muted/30 hover:shadow-md"
        )}
        onClick={() => handleSelectItem(actualGroupIndex, item.id || `item-${itemIndex}`)}
      >
        {/* Header con selección y badge */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <ItemRadio
              itemId={item.id || `item-${itemIndex}`}
              groupKey={group.key}
              selectedId={group.selectedId}
              onSelect={(value) => handleSelectItem(actualGroupIndex, value)}
              isSelected={isSelected}
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-foreground truncate mb-1">
                {group.type === DUPLICATE_TYPES.SKU ? item.name : `SKU: ${item.sku}`}
              </h3>
              {group.type === DUPLICATE_TYPES.SKU && (
                <p className="text-sm text-muted-foreground font-mono">
                  {item.sku}
                </p>
              )}
            </div>
          </div>
          <OriginBadge isExisting={!!item.existingProduct} />
        </div>
        
        {/* Información del producto en grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ProductInfo 
            icon={<DollarSign />} 
            label="Precio" 
            value={item.price !== null ? `$${item.price.toFixed(2)}` : null}
            highlight={isSelected && item.price !== null}
          />
          
          <ProductInfo 
            icon={<DollarSign />} 
            label="Costo" 
            value={item.cost !== null ? `$${item.cost.toFixed(2)}` : null}
            highlight={isSelected && item.cost !== null}
          />
          
          <ProductInfo 
            icon={<Hash />} 
            label="Cantidad" 
            value={item.quantity}
            highlight={isSelected && item.quantity !== null}
          />
          
          <ProductInfo 
            icon={<Tag />} 
            label="Categoría" 
            value={item.category}
            highlight={isSelected && item.category !== null}
          />
        </div>

        {/* Indicador de selección */}
        {isSelected && (
          <div className="absolute top-4 right-4">
            <div className="bg-primary text-primary-foreground rounded-full p-2">
              <Check className="h-4 w-4" />
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Renderiza los controles de resolución
  const renderResolutionControls = (group: DuplicateGroup, groupIndex: number) => {
    const actualGroupIndex = group.type === DUPLICATE_TYPES.NAME ? 
      duplicateGroups.filter(g => g.type === DUPLICATE_TYPES.SKU).length + groupIndex : 
      groupIndex;
    
    return (
      <div className="flex flex-wrap gap-2 items-center">
        <ResolutionOption
          type={RESOLUTION_TYPES.MERGE}
          currentValue={group.resolution}
          onClick={() => handleChangeResolution(actualGroupIndex, RESOLUTION_TYPES.MERGE)}
          icon={<ArrowRightLeft />}
          label="Fusionar"
          tooltip="Combinar información de todos los productos manteniendo el seleccionado como base"
        />
        
        <ResolutionOption
          type={RESOLUTION_TYPES.KEEP}
          currentValue={group.resolution}
          onClick={() => handleChangeResolution(actualGroupIndex, RESOLUTION_TYPES.KEEP)}
          icon={<Check />}
          label="Mantener"
          tooltip="Mantener solo el producto seleccionado y descartar los demás"
        />
        
        <ResolutionOption
          type={RESOLUTION_TYPES.RENAME}
          currentValue={group.resolution}
          onClick={() => handleChangeResolution(actualGroupIndex, RESOLUTION_TYPES.RENAME)}
          icon={<Pencil />}
          label="Renombrar"
          tooltip="Agregar sufijos a los nombres para evitar conflictos"
        />
      </div>
    );
  };

  // Función para renderizar las estadísticas
  const renderStats = () => {
    const skuCount = duplicateGroups.filter(g => g.type === DUPLICATE_TYPES.SKU).length;
    const nameCount = duplicateGroups.filter(g => g.type === DUPLICATE_TYPES.NAME).length;
    
    return (
      <Alert className="bg-amber-50/80 border-amber-200 text-amber-800 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-200">
        <div className="flex items-center gap-4">
          <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0" />
          <AlertDescription className="flex flex-col sm:flex-row sm:gap-6 text-base">
            <span className="font-semibold">{duplicateGroups.length} conflictos encontrados</span>
            <div className="flex gap-6 text-amber-700 dark:text-amber-300">
              <span className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                {skuCount} por SKU
              </span>
              <span className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                {nameCount} por nombre
              </span>
            </div>
          </AlertDescription>
        </div>
      </Alert>
    );
  };
  
  // Renderizado de contenido vacío
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20 px-8">
      <div className="bg-green-50 p-8 rounded-full mb-8 border border-green-200">
        <CheckCircle2 className="h-20 w-20 text-green-600" />
      </div>
      <h3 className="text-2xl font-bold mb-4 text-foreground">
        ¡Todo limpio!
      </h3>
      <p className="text-muted-foreground text-center text-lg mb-8 max-w-md leading-relaxed">
        No se encontraron productos duplicados. Todos los SKUs y nombres son únicos.
      </p>
      <Button size="lg" onClick={() => onOpenChange(false)} className="px-8 py-3">
        Continuar
      </Button>
    </div>
  );
  
  // Renderizado de grupo de duplicados
  const renderDuplicateGroup = (group: DuplicateGroup, groupIndex: number) => (
    <div
      key={`group-${group.key}`}
      className="mb-8 last:mb-0"
    >
      <Card className="overflow-hidden border-2 border-border/60 shadow-lg rounded-2xl bg-card">
        <CardHeader className="bg-muted/30 py-6 px-8 border-b">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col gap-3">
                <Badge variant="secondary" className={cn(
                  "bg-primary/10 text-primary w-fit px-4 py-2 text-base font-semibold rounded-lg",
                  group.type === DUPLICATE_TYPES.SKU ? "font-mono" : ""
                )}>
                  {group.type === DUPLICATE_TYPES.SKU ? (
                    <>📦 SKU: {group.items[0].sku}</>
                  ) : (
                    <span className="truncate max-w-[200px] sm:max-w-[300px]" title={group.items[0].name}>
                      🏷️ {group.items[0].name}
                    </span>
                  )}
                </Badge>
                <p className="text-base text-muted-foreground">
                  <strong>{group.items.length} productos</strong> con el mismo {group.type === DUPLICATE_TYPES.SKU ? 'SKU' : 'nombre'}
                </p>
              </div>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-10 w-10 rounded-full hover:bg-muted"
                    >
                      <Info className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">{getResolutionText(group.resolution)}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <Separator />
            
            <div className="flex flex-col gap-3">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Método de resolución
              </h4>
              {renderResolutionControls(group, groupIndex)}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-8">
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-foreground mb-4">
              Selecciona el producto a mantener:
            </h4>
            {group.items.map((item, itemIndex) => 
              renderItemRow(item, itemIndex, group, groupIndex)
            )}
          </div>
        </CardContent>
        
        <CardFooter className="px-8 py-6 border-t bg-muted/20 flex flex-col sm:flex-row sm:justify-between gap-3">
          <div className="flex items-center gap-3 text-muted-foreground">
            {getResolutionIcon(group.resolution)}
            <span className="text-sm font-medium">{getResolutionText(group.resolution)}</span>
          </div>
          {group.resolution === RESOLUTION_TYPES.MERGE && (
            <div className="text-sm text-muted-foreground bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              💡 Se combinará la información de todos los productos
            </div>
          )}
          {group.resolution === RESOLUTION_TYPES.RENAME && (
            <div className="text-sm text-muted-foreground bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              ✏️ Se agregarán sufijos para diferenciar
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Resolver Productos Duplicados
          </DialogTitle>
          <DialogDescription>
            Se encontraron productos con SKUs o nombres duplicados. Selecciona cómo resolver cada conflicto.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Statistics */}
            <Alert className="bg-amber-50/80 border-amber-200 text-amber-800">
              <div className="flex items-center gap-4">
                <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0" />
                <AlertDescription className="flex flex-col sm:flex-row sm:gap-6 text-base">
                  <span className="font-semibold">{duplicateGroups.length} conflictos encontrados</span>
                </AlertDescription>
              </div>
            </Alert>

            {/* Duplicate groups */}
            {duplicateGroups.map((group, groupIndex) => (
              <Card key={group.key} className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {group.type === 'sku' ? <Package className="h-5 w-5" /> : <Tag className="h-5 w-5" />}
                    Duplicado por {group.type === 'sku' ? 'SKU' : 'Nombre'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Resolution controls */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <Button
                      variant={group.resolution === 'merge' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleChangeResolution(groupIndex, 'merge')}
                    >
                      <ArrowRightLeft className="h-4 w-4 mr-2" />
                      Fusionar
                    </Button>
                    <Button
                      variant={group.resolution === 'keep' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleChangeResolution(groupIndex, 'keep')}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Mantener
                    </Button>
                    <Button
                      variant={group.resolution === 'rename' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleChangeResolution(groupIndex, 'rename')}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Renombrar
                    </Button>
                  </div>

                  {/* Items */}
                  <RadioGroup
                    value={group.selectedId}
                    onValueChange={(value) => handleSelectItem(groupIndex, value)}
                    className="space-y-4"
                  >
                    {group.items.map((item, itemIndex) => (
                      <div
                        key={`${group.key}-${itemIndex}`}
                        className={cn(
                          "relative rounded-xl border-2 p-6 cursor-pointer transition-all duration-300",
                          item.id === group.selectedId
                            ? "border-primary bg-primary/5 shadow-lg"
                            : "border-border hover:border-primary/40 hover:bg-muted/30"
                        )}
                        onClick={() => handleSelectItem(groupIndex, item.id)}
                      >
                        <div className="flex items-start gap-4">
                          <RadioItem
                            value={item.id}
                            id={`radio-${group.key}-${itemIndex}`}
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold text-lg">{item.name}</h4>
                                <p className="text-sm text-muted-foreground font-mono">SKU: {item.sku}</p>
                              </div>
                              <Badge variant={item.existingProduct ? 'default' : 'secondary'}>
                                {item.existingProduct ? 'En Sistema' : 'Excel'}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Precio:</span>
                                <p className="font-medium">
                                  {item.price !== null ? `$${item.price.toFixed(2)}` : '-'}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Costo:</span>
                                <p className="font-medium">
                                  {item.cost !== null ? `$${item.cost.toFixed(2)}` : '-'}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Cantidad:</span>
                                <p className="font-medium">{item.quantity || '-'}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Categoría:</span>
                                <p className="font-medium">{item.category || '-'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleApplyResolutions} disabled={isProcessing}>
            {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Aplicar Resoluciones
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 