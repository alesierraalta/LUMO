import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Tag
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
  CardHeader
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

// Animaciones
// ----------
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.15,
      when: "beforeChildren"
    }
  },
  exit: { opacity: 0 }
};

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: "spring", stiffness: 400, damping: 25 }
  },
  exit: { 
    y: -20, 
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

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
        <motion.div 
          layoutId={`selected-glow-${groupKey}`}
          className="absolute -inset-2 bg-primary/10 rounded-full -z-10 border-2 border-primary/20"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
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
      <motion.div
        key={`row-${group.key}-${itemIndex}-${item.id || item.rowId || itemIndex}`}
        variants={itemVariants}
        layout
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
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-4 right-4"
          >
            <div className="bg-primary text-primary-foreground rounded-full p-2">
              <Check className="h-4 w-4" />
            </div>
          </motion.div>
        )}
      </motion.div>
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
    <motion.div 
      className="flex flex-col items-center justify-center py-20 px-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.div 
        className="bg-green-50 p-8 rounded-full mb-8 border border-green-200"
        variants={itemVariants}
      >
        <CheckCircle2 className="h-20 w-20 text-green-600" />
      </motion.div>
      <motion.h3 
        className="text-2xl font-bold mb-4 text-foreground"
        variants={itemVariants}
      >
        ¡Todo limpio!
      </motion.h3>
      <motion.p 
        className="text-muted-foreground text-center text-lg mb-8 max-w-md leading-relaxed"
        variants={itemVariants}
      >
        No se encontraron productos duplicados. Todos los SKUs y nombres son únicos.
      </motion.p>
      <motion.div variants={itemVariants}>
        <Button size="lg" onClick={() => onOpenChange(false)} className="px-8 py-3">
          Continuar
        </Button>
      </motion.div>
    </motion.div>
  );
  
  // Renderizado de grupo de duplicados
  const renderDuplicateGroup = (group: DuplicateGroup, groupIndex: number) => (
    <motion.div
      key={`group-${group.key}`}
      variants={itemVariants}
      layout
      initial="hidden"
      animate="visible"
      exit="exit"
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
          <motion.div 
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <h4 className="text-lg font-semibold text-foreground mb-4">
              Selecciona el producto a mantener:
            </h4>
            {group.items.map((item, itemIndex) => 
              renderItemRow(item, itemIndex, group, groupIndex)
            )}
          </motion.div>
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
    </motion.div>
  );
  
  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent 
            className="w-[98vw] max-w-7xl max-h-[95vh] flex flex-col p-0 gap-0 overflow-hidden bg-background rounded-2xl border-2 border-border/60 shadow-2xl"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <DialogHeader className="px-8 pt-8 pb-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-full bg-amber-100 border border-amber-200">
                    <AlertTriangle className="h-8 w-8 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-3xl font-bold mb-2">Resolver Duplicados</DialogTitle>
                    <DialogDescription className="text-lg text-muted-foreground">
                      Se encontraron productos duplicados en tu importación. Selecciona cómo quieres resolverlos.
                    </DialogDescription>
                  </div>
                  <DialogClose asChild>
                    <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full hover:bg-muted">
                      <X className="h-6 w-6" />
                    </Button>
                  </DialogClose>
                </div>
              </DialogHeader>
            </motion.div>
            
            {duplicateGroups.length === 0 ? renderEmptyState() : (
              <>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <div className="flex flex-col gap-6 px-8 py-6 border-y-2 bg-muted/20">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                        <div className="flex items-center space-x-4">
                          <Switch 
                            id="auto-resolve" 
                            checked={autoResolve}
                            onCheckedChange={setAutoResolve}
                            className="scale-125 data-[state=checked]:bg-primary"
                          />
                          <Label htmlFor="auto-resolve" className="text-lg font-semibold cursor-pointer">
                            Resolución automática
                          </Label>
                        </div>
                        
                        <Button 
                          onClick={handleAutoResolve} 
                          variant="outline"
                          size="lg"
                          disabled={isProcessing || !autoResolve}
                          className="h-12 px-6 border-2"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                              <span>Procesando...</span>
                            </>
                          ) : (
                            <>
                              <ListFilter className="mr-3 h-5 w-5" />
                              Aplicar reglas inteligentes
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {renderStats()}
                    </div>
                  </div>
                </motion.div>
                
                <Tabs 
                  value={selectedTab} 
                  onValueChange={setSelectedTab} 
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                  >
                    <TabsList className="px-8 justify-start border-b-2 rounded-none bg-transparent h-auto py-8 gap-6">
                      <TabsTrigger 
                        value={DUPLICATE_TYPES.SKU} 
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl text-xl h-16 px-8 py-4 font-bold shadow-sm"
                      >
                        <Package className="h-6 w-6 mr-4" />
                        SKUs ({duplicateGroups.filter(g => g.type === DUPLICATE_TYPES.SKU).length})
                      </TabsTrigger>
                      <TabsTrigger 
                        value={DUPLICATE_TYPES.NAME}
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl text-xl h-16 px-8 py-4 font-bold shadow-sm"
                      >
                        <Tag className="h-6 w-6 mr-4" />
                        Nombres ({duplicateGroups.filter(g => g.type === DUPLICATE_TYPES.NAME).length})
                      </TabsTrigger>
                    </TabsList>
                  </motion.div>
                  
                  <TabsContent value={DUPLICATE_TYPES.SKU} className="flex-1 overflow-hidden m-0 p-0">
                    <ScrollArea className="h-[50vh] sm:h-[60vh] md:h-[calc(100vh-400px)]">
                      <motion.div 
                        className="p-8"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        {duplicateGroups
                          .filter(group => group.type === DUPLICATE_TYPES.SKU)
                          .map((group, groupIndex) => renderDuplicateGroup(group, groupIndex))}
                      </motion.div>
                    </ScrollArea>
                  </TabsContent>
                  
                  <TabsContent value={DUPLICATE_TYPES.NAME} className="flex-1 overflow-hidden m-0 p-0">
                    <ScrollArea className="h-[50vh] sm:h-[60vh] md:h-[calc(100vh-400px)]">
                      <motion.div 
                        className="p-8"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        {duplicateGroups
                          .filter(group => group.type === DUPLICATE_TYPES.NAME)
                          .map((group, groupIndex) => renderDuplicateGroup(group, groupIndex))}
                      </motion.div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
                
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <DialogFooter className="px-8 py-6 border-t-2 bg-muted/10">
                    <div className="flex gap-4 w-full sm:w-auto">
                      <Button 
                        variant="outline" 
                        onClick={() => onOpenChange(false)} 
                        className="flex-1 sm:flex-initial h-12 px-8 text-base border-2"
                      >
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleApplyResolutions} 
                        disabled={isProcessing}
                        className="gap-3 flex-1 sm:flex-initial h-12 px-8 text-base font-semibold"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                        Aplicar resoluciones
                      </Button>
                    </div>
                  </DialogFooter>
                </motion.div>
              </>
            )}
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
} 