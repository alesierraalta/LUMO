"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, FileUp, AlertCircle, Table, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { 
  Table as UITable, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { ScrollArea } from "@/components/ui/scroll-area";

// Define types
interface ImportFormProps {
  userId: string;
}

type ProcessingStage = 
  | 'idle' 
  | 'uploading' 
  | 'processing' 
  | 'mapping' 
  | 'analyzing'
  | 'preview' 
  | 'importing' 
  | 'complete' 
  | 'completed' // Para compatibilidad
  | 'error';

type FieldMapping = {
  excelField: string;
  inventoryField: string;
  confidence: number;
};

type PreviewItem = {
  rowId: number;
  name: string;
  sku: string;
  price: number | null;
  cost: number | null;
  quantity: number | null;
  category: string | null;
  location: string | null;
  description: string | null;
  confidence: {
    name: number;
    sku: number;
    price: number;
    cost: number;
    quantity: number;
    category: number;
    location: number;
    description: number;
  };
  originalData: Record<string, any>;
  warnings?: {
    duplicateSku?: boolean;
    existingSku?: boolean;
    invalid?: boolean;
    negativeValues?: boolean;
    duplicateName?: boolean;
  }
};

export default function ImportForm({ userId }: ImportFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [stage, setStage] = useState<ProcessingStage>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [previewData, setPreviewData] = useState<PreviewItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [importStats, setImportStats] = useState<{
    total: number;
    success: number;
    warning: number;
    error: number;
  }>({ total: 0, success: 0, warning: 0, error: 0 });
  
  // Plantillas de mapeo
  const [templateName, setTemplateName] = useState<string>("");
  const [savedTemplates, setSavedTemplates] = useState<{name: string, mappings: FieldMapping[]}[]>([]);
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState<boolean>(false);


  // Cargar plantillas guardadas al inicio
  useEffect(() => {
    // Cargar plantillas desde localStorage
    const savedTemplatesJSON = localStorage.getItem('importMappingTemplates');
    if (savedTemplatesJSON) {
      try {
        const templates = JSON.parse(savedTemplatesJSON);
        if (Array.isArray(templates)) {
          setSavedTemplates(templates);
        }
      } catch (error) {
        console.error('Error parsing saved templates:', error);
      }
    }
  }, []);

  // Guardar plantilla actual
  const saveCurrentTemplate = () => {
    if (!templateName.trim()) {
      toast.error("Nombre requerido", {
        description: "Por favor ingresa un nombre para la plantilla"
      });
      return;
    }

    // Verificar si ya existe una plantilla con ese nombre
    const existingTemplateIndex = savedTemplates.findIndex(t => t.name === templateName);
    
    const newTemplate = { name: templateName, mappings: mappings };
    let newTemplates = [...savedTemplates];
    
    if (existingTemplateIndex >= 0) {
      // Actualizar plantilla existente
      newTemplates[existingTemplateIndex] = newTemplate;
      toast.success("Plantilla actualizada", {
        description: `La plantilla "${templateName}" ha sido actualizada`
      });
    } else {
      // Crear nueva plantilla
      newTemplates.push(newTemplate);
      toast.success("Plantilla guardada", {
        description: `La plantilla "${templateName}" ha sido guardada`
      });
    }
    
    // Guardar en localStorage
    localStorage.setItem('importMappingTemplates', JSON.stringify(newTemplates));
    setSavedTemplates(newTemplates);
    
    // Cerrar diálogo
    setShowSaveTemplateDialog(false);
    setTemplateName("");
  };

  // Cargar plantilla guardada
  const loadTemplate = (templateIndex: number) => {
    if (templateIndex >= 0 && templateIndex < savedTemplates.length) {
      const template = savedTemplates[templateIndex];
      
      // Filtrar y adaptar las asignaciones según las columnas actuales
      const currentColumns = new Set(excelColumns);
      
      // Aplicar solo los mapeos que existen en las columnas actuales
      const filteredMappings = template.mappings.filter(
        mapping => currentColumns.has(mapping.excelField)
      );
      
      // Combinar con mapeos existentes para columnas no cubiertas por la plantilla
      const existingFieldsInTemplate = new Set(filteredMappings.map(m => m.excelField));
      const unmappedFields = mappings.filter(
        mapping => !existingFieldsInTemplate.has(mapping.excelField)
      );
      
      // Establecer los nuevos mapeos
      setMappings([...filteredMappings, ...unmappedFields]);
      
      toast.success("Plantilla cargada", {
        description: `Se ha aplicado la plantilla "${template.name}"`
      });
    }
  };

  // Eliminar plantilla guardada
  const deleteTemplate = (templateIndex: number) => {
    if (templateIndex >= 0 && templateIndex < savedTemplates.length) {
      const templateName = savedTemplates[templateIndex].name;
      const newTemplates = savedTemplates.filter((_, index) => index !== templateIndex);
      
      // Guardar en localStorage
      localStorage.setItem('importMappingTemplates', JSON.stringify(newTemplates));
      setSavedTemplates(newTemplates);
      
      toast.success("Plantilla eliminada", {
        description: `La plantilla "${templateName}" ha sido eliminada`
      });
    }
  };

  // Trigger file input click
  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' && 
          file.type !== 'application/vnd.ms-excel' &&
          file.type !== 'text/csv') {
        toast.error("Formato de archivo no válido", {
          description: "Por favor selecciona un archivo Excel (.xlsx, .xls) o CSV"
        });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error("Archivo demasiado grande", {
          description: "El tamaño máximo permitido es 10MB"
        });
        return;
      }
      
      setSelectedFile(file);
      setErrorMessage("");
    }
  };

  // Handle drag over event
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      
      if (file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' && 
          file.type !== 'application/vnd.ms-excel' &&
          file.type !== 'text/csv') {
        toast.error("Formato de archivo no válido", {
          description: "Por favor selecciona un archivo Excel (.xlsx, .xls) o CSV"
        });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error("Archivo demasiado grande", {
          description: "El tamaño máximo permitido es 10MB"
        });
        return;
      }
      
      setSelectedFile(file);
      setErrorMessage("");
    }
  };

  // Process the uploaded file
  const processFile = async () => {
    try {
      if (!selectedFile) {
        toast.error('No se ha seleccionado ningún archivo');
        return;
      }

      setStage('uploading');
      setProgress(0);

      // Create a FormData instance to send the file
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('userId', userId);
      if (notes) {
        formData.append('notes', notes);
      }

      // Upload the file
      const uploadResponse = await fetch('/api/inventory/import/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Error al subir el archivo');
      }

      setProgress(30);
      const { filePath, sessionId: uploadSessionId } = await uploadResponse.json();
      setSessionId(uploadSessionId);

      // Process the file
      setStage('processing');
      
      const processResponse = await fetch('/api/inventory/import/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath,
          fileName: selectedFile.name,
          sessionId: uploadSessionId,
          userId,
        }),
      });

      if (!processResponse.ok) {
        const errorData = await processResponse.json();
        throw new Error(errorData.error || 'Error al procesar el archivo');
      }

      setProgress(70);
      
      const processResult = await processResponse.json();
      const { columns, mappings: suggestedMappings, preview: initialPreviewData } = processResult;

      // Set the data
      setExcelColumns(columns);
      setMappings(suggestedMappings);
      setPreviewData(initialPreviewData);
      
      setProgress(100);
      setStage('mapping');
    } catch (error) {
      console.error('Error processing file:', error);
      setStage('idle');
      toast.error('Error al procesar el archivo', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  // Update a mapping
  const updateMapping = (index: number, inventoryField: string) => {
    const newMappings = [...mappings];
    newMappings[index].inventoryField = inventoryField;
    setMappings(newMappings);
  };

  // Update a preview item
  const updatePreviewItem = (index: number, field: keyof PreviewItem, value: any) => {
    const newPreviewData = [...previewData];
    
    // Convert numeric fields to proper numbers
    if (field === 'price' || field === 'cost' || field === 'quantity') {
      if (value === '' || value === null || value === undefined) {
        // @ts-ignore - This is a dynamic field access
        newPreviewData[index][field] = null;
      } else {
        const numValue = parseFloat(value);
        // @ts-ignore - This is a dynamic field access
        newPreviewData[index][field] = isNaN(numValue) ? null : numValue;
      }
    } else {
    // @ts-ignore - This is a dynamic field access
    newPreviewData[index][field] = value;
    }
    
    setPreviewData(newPreviewData);
  };

  // Proceed to preview
  const handleProceedToPreview = async () => {
    // Validate that all required fields are mapped
    const requiredFields = ['sku', 'quantity'];
    const mappedFields = mappings
      .filter(m => m.inventoryField && m.inventoryField !== 'none')
      .map(m => m.inventoryField);
    
    const missingFields = requiredFields.filter(field => !mappedFields.includes(field));
    
    if (missingFields.length > 0) {
      toast.error("Faltan campos requeridos", {
        description: `Por favor mapea los siguientes campos: ${missingFields.join(', ')}`
      });
      return;
    }

    // Validación avanzada: detectar posibles problemas en los datos
    setStage('analyzing');
    setProgress(60);
    
    try {
      // Verificar SKUs duplicados
      const skus = new Set<string>();
      const duplicateSkuMap = new Map<string, number[]>();
      
      previewData.forEach(item => {
        if (item.sku) {
          if (skus.has(item.sku)) {
            if (!duplicateSkuMap.has(item.sku)) {
              duplicateSkuMap.set(item.sku, []);
            }
            duplicateSkuMap.get(item.sku)?.push(item.rowId);
          } else {
            skus.add(item.sku);
          }
        }
      });
      
      // Convertir el mapa a un array para facilitar la presentación
      const duplicateSkus = Array.from(duplicateSkuMap.entries());
      
      // Verificar si los SKUs ya existen en la base de datos
      const existingSkus: {sku: string, existing: boolean}[] = [];
      
      if (skus.size > 0) {
        const response = await fetch('/api/inventory/check-skus', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            skus: Array.from(skus)
          }),
        });
        
        if (response.ok) {
          const result = await response.json();
          existingSkus.push(...result.skus);
        }
      }
      
      // Verificar que los nombres no estén vacíos y tengan formato válido
      const invalidItems = previewData.filter(item => 
        (!item.name && !item.sku) || // Si no hay nombre ni SKU
        !item.sku || // Si no hay SKU (siempre requerido)
        item.sku.trim() === '' ||
        (item.quantity !== null && item.quantity < 0)
      );
      
      // Detectar posibles precios o costos negativos
      const negativeValues = previewData.filter(item => 
        (item.price !== null && item.price < 0) || 
        (item.cost !== null && item.cost < 0)
      );
      
      // Crear un registro de advertencias
      const warnings: string[] = [];
      
      if (duplicateSkus.length > 0) {
        warnings.push(`Se encontraron ${duplicateSkus.length} códigos SKU duplicados en los datos importados.`);
      }
      
      if (existingSkus.filter(e => e.existing).length > 0) {
        warnings.push(`${existingSkus.filter(e => e.existing).length} SKUs ya existen en la base de datos y serán actualizados.`);
      }
      
      if (invalidItems.length > 0) {
        warnings.push(`${invalidItems.length} productos tienen datos incompletos o inválidos.`);
      }
      
      if (negativeValues.length > 0) {
        warnings.push(`${negativeValues.length} productos tienen precios o costos negativos.`);
      }
      
      // Mostrar advertencias si es necesario
      if (warnings.length > 0) {
        toast.warning("Advertencias de importación", {
          description: (
            <ul className="list-disc pl-4 space-y-1 mt-2">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          ),
          duration: 8000,
        });
      }
      
      // Mostrar detalles de SKUs duplicados si existen
      if (duplicateSkus.length > 0) {
        toast.warning("SKUs duplicados", {
          description: (
            <div className="space-y-2">
              <p className="font-medium">Se han encontrado SKUs duplicados en los siguientes productos:</p>
              <div className="max-h-[200px] overflow-y-auto border rounded-md bg-orange-50 p-2">
                <ul className="list-disc pl-4 space-y-1">
                  {duplicateSkus.map(([sku, rows], index) => (
                    <li key={index} className="text-orange-800">
                      <strong className="font-bold">{sku}</strong>: Filas {rows.join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ),
          duration: 10000,
        });
      }
      
      // Marcar visualmente los elementos con problemas
      const updatedPreviewData = previewData.map(item => {
        const hasDuplicateSku = duplicateSkus.some(([sku, rows]) => sku === item.sku);
        const existingSku = existingSkus.find(e => e.sku === item.sku && e.existing);
        const isInvalid = (!item.name && !item.sku) || !item.sku || (item.quantity !== null && item.quantity < 0);
        const hasNegativeValues = (item.price !== null && item.price < 0) || (item.cost !== null && item.cost < 0);
        
        // Añadir indicadores visuales para problemas
        return {
          ...item,
          warnings: {
            duplicateSku: hasDuplicateSku,
            existingSku: !!existingSku,
            invalid: isInvalid,
            negativeValues: hasNegativeValues
          }
        };
      });
      
      // Actualizar los datos de vista previa con las advertencias
      setPreviewData(updatedPreviewData);
      
      // Detectar duplicados en los datos de vista previa
      const skuMap = new Map();
      const nameMap = new Map();
      const skuDuplicates: { [key: string]: any[] } = {};
      const nameDuplicates: { [key: string]: any[] } = {};
      
      // Primero, verificar duplicados en los datos importados
      updatedPreviewData.forEach(item => {
        // Verificar duplicados por SKU
        if (item.sku) {
          const skuKey = item.sku.toLowerCase();
          if (!skuMap.has(skuKey)) {
            skuMap.set(skuKey, []);
          }
          skuMap.get(skuKey).push(item);
        }
        
        // Verificar duplicados por nombre
        if (item.name) {
          const nameKey = item.name.toLowerCase();
          if (!nameMap.has(nameKey)) {
            nameMap.set(nameKey, []);
          }
          nameMap.get(nameKey).push(item);
        }
      });
      
      // Marcar duplicados y agruparlos
      for (const [sku, items] of skuMap.entries()) {
        if (items.length > 1) {
          skuDuplicates[sku] = items;
          items.forEach(item => {
            item.warnings = { 
              ...item.warnings,
              duplicateSku: true
            };
          });
        }
      }
      
      for (const [name, items] of nameMap.entries()) {
        if (items.length > 1) {
          nameDuplicates[name] = items;
          
          // Solo marcar como duplicados por nombre si no son duplicados por SKU
          items.forEach(item => {
            if (!item.warnings?.duplicateSku) {
              item.warnings = { 
                ...item.warnings,
                duplicateName: true
              };
            }
          });
        }
      }
      

      
      setProgress(100);
    } catch (error) {
      console.error("Error durante la validación avanzada:", error);
      toast.error("Error en la validación", {
        description: error instanceof Error ? error.message : "Ocurrió un error al validar los datos"
      });
    }
    
    setStage('preview');
  };

  // Process final import
  const handleCommitImport = async () => {
    try {
      setStage('importing');
      setProgress(0);
      
      // Verificar que tengamos un sessionId válido
      if (!sessionId) {
        throw new Error('No se encontró una sesión de importación válida. Por favor, sube el archivo nuevamente.');
      }
      
      // Sanitizar datos antes de enviar - conversión más robusta
      const sanitizedItems = previewData.map(item => {
        // Función helper para convertir a número
        const toNumber = (value: any): number | null => {
          if (value === null || value === undefined || value === '') {
            return null;
          }
          if (typeof value === 'number') {
            return isNaN(value) ? null : value;
          }
          if (typeof value === 'string') {
            const parsed = parseFloat(value);
            return isNaN(parsed) ? null : parsed;
          }
          if (typeof value === 'object') {
            // Si es un objeto, intentar extraer el valor
            if (value.target && value.target.value !== undefined) {
              return toNumber(value.target.value);
            }
            if (value.value !== undefined) {
              return toNumber(value.value);
            }
            return null;
          }
          return null;
        };

        return {
          ...item,
          price: toNumber(item.price),
          cost: toNumber(item.cost),
          quantity: toNumber(item.quantity),
          // Asegurar que los strings no estén vacíos
          name: item.name || '',
          sku: item.sku || '',
          category: item.category || null,
          location: item.location || null,
          description: item.description || null
        };
      });
      
      // Enviar datos como JSON en lugar de FormData
      const requestData = {
        userId,
        sessionId,
        items: sanitizedItems,
        notes: notes || ''
      };
      
      const response = await fetch('/api/inventory/import/commit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al procesar la importación');
      }
      
      const data = await response.json();
      
      // Actualizar estadísticas de importación
      setImportStats({
        total: data.total || 0,
        success: data.successCount || 0,
        warning: data.warning || 0,
        error: data.error || 0,
      });
      
      // Cambiar a la etapa completa
      setStage('complete');
      setProgress(100);
      
      // Mostrar mensaje de éxito
      toast.success('Importación completada', {
        description: `${data.successCount} de ${data.total} productos procesados exitosamente`
      });
      
    } catch (error) {
      setStage('error');
      console.error('Error en importación:', error);
      
      setErrorMessage(error instanceof Error ? error.message : 'Error desconocido durante la importación');
      
      toast.error('Error en importación', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  // Reset the form
  const handleReset = () => {
    setSelectedFile(null);
    setNotes("");
    setStage('idle');
    setProgress(0);
    setExcelColumns([]);
    setMappings([]);
    setPreviewData([]);
    setErrorMessage("");
    setImportStats({ total: 0, success: 0, warning: 0, error: 0 });
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Render confidence badge
  const renderConfidenceBadge = (confidence: number) => {
    let variant = 'outline';
    let label = 'Baja';
    
    if (confidence >= 0.8) {
      variant = 'default';
      label = 'Alta';
    } else if (confidence >= 0.5) {
      variant = 'secondary';
      label = 'Media';
    }
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={variant as any} className="ml-2">
              {label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Confianza: {Math.round(confidence * 100)}%</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };



  // Render different stages
  const renderStageContent = () => {
    switch (stage) {
      case 'idle':
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 w-full max-w-lg mx-auto text-center cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={handleFileSelect}
            >
              <FileUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Selecciona un archivo</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Formatos soportados: Excel (.xlsx, .xls), CSV (.csv)
              </p>
              <Button variant="secondary" size="sm" onClick={(e) => {
                e.stopPropagation(); // Evitar que el evento se propague
                handleFileSelect();
              }}>
                Examinar
              </Button>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange}
              className="hidden" 
              accept=".xlsx,.xls,.csv"
            />
            
            {/* Mostrar archivo seleccionado si existe */}
            {selectedFile && (
              <div className="mt-6 w-full max-w-lg">
                <div className="flex justify-between items-center p-3 border rounded-md bg-muted/20">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <FileUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={processFile}
                  >
                    Procesar
                  </Button>
                </div>
                <div className="mt-4">
                  <Label htmlFor="notes" className="text-sm">Notas (opcional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Agrega notas o información relevante sobre esta importación..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>
        );
        
      case 'uploading':
      case 'processing':
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <RefreshCw className="h-12 w-12 animate-spin text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {stage === 'uploading' ? 'Subiendo archivo...' : 'Procesando datos...'}
            </h3>
            <div className="w-full max-w-xs mt-4">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">{progress}% completado</p>
            </div>
          </div>
        );
        
      case 'mapping':
        return (
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4">Mapeo de Columnas</h3>
            <p className="text-sm text-muted-foreground mb-6">
              El sistema ha detectado las siguientes columnas en tu archivo. Por favor, verifica y ajusta el mapeo según sea necesario.
            </p>
            
            {/* Plantillas de mapeo */}
            <div className="mb-6 border rounded-md p-4 bg-muted/20">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-medium">Plantillas de Mapeo</h4>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowSaveTemplateDialog(true)}
                >
                  Guardar Como Plantilla
                </Button>
              </div>
              
              {savedTemplates.length > 0 ? (
                <div className="space-y-2">
                  {savedTemplates.map((template, index) => (
                    <div key={index} className="flex items-center justify-between border rounded-md p-2 bg-background">
                      <span className="font-medium">{template.name}</span>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => loadTemplate(index)}
                        >
                          Aplicar
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => deleteTemplate(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay plantillas guardadas. Guarda tu mapeo actual como plantilla para reutilizarlo en futuras importaciones.
                </p>
              )}
            </div>
            
            <div className="border rounded-md overflow-hidden">
              <UITable>
                <TableHeader>
                  <TableRow>
                    <TableHead>Columna Excel</TableHead>
                    <TableHead>Campo en Inventario</TableHead>
                    <TableHead>Confianza</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappings.map((mapping, index) => (
                    <TableRow key={index}>
                      <TableCell>{mapping.excelField}</TableCell>
                      <TableCell>
                        <Select
                          value={mapping.inventoryField}
                          onValueChange={(value) => updateMapping(index, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar campo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No mapear</SelectItem>
                            <SelectItem value="name">Nombre</SelectItem>
                            <SelectItem value="sku">SKU</SelectItem>
                            <SelectItem value="price">Precio</SelectItem>
                            <SelectItem value="cost">Costo</SelectItem>
                            <SelectItem value="quantity">Cantidad</SelectItem>
                            <SelectItem value="category">Categoría</SelectItem>
                            <SelectItem value="location">Ubicación</SelectItem>
                            <SelectItem value="description">Descripción</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {renderConfidenceBadge(mapping.confidence)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </UITable>
            </div>
            
            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={handleReset}>
                Cancelar
              </Button>
              <Button onClick={handleProceedToPreview}>
                Continuar a Vista Previa
              </Button>
            </div>
            
            {/* Diálogo para guardar plantilla */}
            {showSaveTemplateDialog && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-background p-6 rounded-lg shadow-lg w-full max-w-md">
                  <h3 className="text-lg font-semibold mb-4">Guardar Plantilla de Mapeo</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-name">Nombre de la Plantilla</Label>
                      <Input
                        id="template-name"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="Ej: Plantilla Excel Proveedor A"
                      />
                    </div>
                    
                    <div className="pt-4 flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowSaveTemplateDialog(false);
                          setTemplateName("");
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={saveCurrentTemplate}>
                        Guardar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
        
      case 'preview':
        return (
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4">Vista Previa de Datos</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Revisa y edita los datos extraídos antes de importarlos al inventario. Los campos con confianza baja deben ser verificados.
            </p>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Vista previa de datos</h2>
              </div>
              
              {/* Sección de duplicados detectados */}
              {(() => {
                const duplicatedSkus = previewData.filter(item => item.warnings?.duplicateSku);
                const duplicatedNames = previewData.filter(item => item.warnings?.duplicateName);
                const hasDuplicates = duplicatedSkus.length > 0 || duplicatedNames.length > 0;
                
                if (hasDuplicates) {
                  return (
                    <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-4">
                      <div className="flex items-center mb-3">
                        <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-2" />
                        <h3 className="font-semibold text-orange-800 dark:text-orange-200">Productos Duplicados Detectados</h3>
                      </div>
                      
                      <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                        Se han encontrado productos con SKUs o nombres duplicados. Revisa los elementos resaltados en la tabla y edítalos según sea necesario.
                      </p>
                      
                      <div className="space-y-2">
                        {duplicatedSkus.length > 0 && (
                          <div className="bg-white dark:bg-gray-800/50 rounded-md p-3 border border-orange-200 dark:border-orange-700">
                            <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-2">SKUs Duplicados ({duplicatedSkus.length} productos)</h4>
                            <div className="text-sm text-orange-700 dark:text-orange-300">
                              <p className="mb-1">Productos con SKUs duplicados están resaltados en naranja.</p>
                              <p><strong>Sugerencias:</strong></p>
                              <ul className="list-disc list-inside ml-2 space-y-1">
                                <li>Modifica los SKUs para hacerlos únicos</li>
                                <li>Elimina los productos duplicados editando su contenido</li>
                                <li>Verifica que los productos realmente sean diferentes</li>
                              </ul>
                            </div>
                          </div>
                        )}
                        
                        {duplicatedNames.length > 0 && (
                          <div className="bg-white dark:bg-gray-800/50 rounded-md p-3 border border-orange-200 dark:border-orange-700">
                            <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-2">Nombres Duplicados ({duplicatedNames.length} productos)</h4>
                            <div className="text-sm text-orange-700 dark:text-orange-300">
                              <p className="mb-1">Productos con nombres similares detectados.</p>
                              <p><strong>Sugerencias:</strong></p>
                              <ul className="list-disc list-inside ml-2 space-y-1">
                                <li>Revisa si son realmente productos diferentes</li>
                                <li>Modifica los nombres para diferenciarlos</li>
                                <li>Considera si deben fusionarse en un solo producto</li>
                              </ul>
                            </div>
                          </div>
                        )}
                        
                                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-4">
                           {/* Acciones para SKUs duplicados */}
                           {duplicatedSkus.length > 0 && (
                             <>
                                                               <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => {
                                    // Eliminar todos los productos con SKUs duplicados
                                    const originalCount = previewData.length;
                                    const updatedData = previewData.filter(item => !item.warnings?.duplicateSku);
                                    const removedCount = originalCount - updatedData.length;
                                    
                                    setPreviewData(updatedData);
                                    toast.success("SKUs duplicados eliminados", {
                                      description: `Se eliminaron ${removedCount} productos con SKUs duplicados`
                                    });
                                  }}
                                >
                                  🗑️ Eliminar SKUs Duplicados
                                </Button>
                               
                                                               <Button 
                                  variant="secondary" 
                                  size="sm"
                                  onClick={() => {
                                    // Mantener solo el primer producto de cada SKU duplicado
                                    const seenSkus = new Set<string>();
                                    const originalCount = previewData.length;
                                    
                                    const updatedData = previewData.filter(item => {
                                      if (item.warnings?.duplicateSku && item.sku) {
                                        if (seenSkus.has(item.sku)) {
                                          return false; // Eliminar duplicados
                                        }
                                        seenSkus.add(item.sku);
                                        // Limpiar la advertencia del primer elemento
                                        item.warnings.duplicateSku = false;
                                      }
                                      return true;
                                    });
                                    
                                    const removedCount = originalCount - updatedData.length;
                                    setPreviewData(updatedData);
                                    toast.success("Duplicados por SKU resueltos", {
                                      description: `Se mantuvo solo el primer producto de cada SKU duplicado. Eliminados: ${removedCount}`
                                    });
                                  }}
                                >
                                  📝 Mantener Primeros SKUs
                                </Button>
                               
                  <Button 
                    variant="outline" 
                    size="sm"
                                  onClick={() => {
                                    // Renombrar SKUs duplicados agregando sufijo numérico
                                    const skuCounts = new Map<string, number>();
                                    let renamedCount = 0;
                                    
                                    const updatedData = previewData.map(item => {
                                      if (item.warnings?.duplicateSku && item.sku) {
                                        const originalSku = item.sku.split('-')[0]; // En caso de que ya tenga sufijo
                                        const count = skuCounts.get(originalSku) || 0;
                                        skuCounts.set(originalSku, count + 1);
                                        
                                        if (count === 0) {
                                          // El primer elemento mantiene el SKU original pero quita la advertencia
                                          return {
                                            ...item,
                                            warnings: {
                                              ...item.warnings,
                                              duplicateSku: false
                                            }
                                          };
                                        } else {
                                          // Los siguientes obtienen sufijo numérico
                                          renamedCount++;
                                          return {
                                            ...item,
                                            sku: `${originalSku}-${count + 1}`,
                                            warnings: {
                                              ...item.warnings,
                                              duplicateSku: false
                                            }
                                          };
                                        }
                                      }
                                      return item;
                                    });
                                    
                                    setPreviewData(updatedData);
                                    toast.success("SKUs renombrados automáticamente", {
                                      description: `Se renombraron ${renamedCount} SKUs duplicados con sufijos numéricos`
                                    });
                                  }}
                                >
                                  🔄 Auto-Renombrar SKUs
                                </Button>
                             </>
                           )}
                           
                           {/* Acciones para nombres duplicados */}
                           {duplicatedNames.length > 0 && (
                             <>
                               <Button 
                                 variant="outline" 
                                 size="sm"
                                 onClick={() => {
                                   // Renombrar nombres duplicados agregando información del SKU
                                   const updatedData = previewData.map(item => {
                                     if (item.warnings?.duplicateName) {
                                       return {
                                         ...item,
                                         name: `${item.name} (${item.sku})`,
                                         warnings: {
                                           ...item.warnings,
                                           duplicateName: false
                                         }
                                       };
                                     }
                                     return item;
                                   });
                                   
                                   setPreviewData(updatedData);
                                   toast.success("Nombres diferenciados", {
                                     description: "Se agregó el SKU a los nombres duplicados para diferenciarlos"
                                   });
                                 }}
                               >
                                 🏷️ Diferenciar por SKU
                               </Button>
                               
                               <Button 
                                 variant="outline" 
                                 size="sm"
                                 onClick={() => {
                                   // Agregar número secuencial a nombres duplicados
                                   const nameCounts = new Map<string, number>();
                                   const updatedData = previewData.map(item => {
                                     if (item.warnings?.duplicateName && item.name) {
                                       const count = nameCounts.get(item.name) || 0;
                                       nameCounts.set(item.name, count + 1);
                                       
                                       if (count > 0) {
                                         return {
                                           ...item,
                                           name: `${item.name} ${count + 1}`,
                                           warnings: {
                                             ...item.warnings,
                                             duplicateName: false
                                           }
                                         };
                                       }
                                     }
                                     return item;
                                   });
                                   
                                   setPreviewData(updatedData);
                                   toast.success("Nombres numerados", {
                                     description: "Se agregaron números secuenciales a los nombres duplicados"
                                   });
                                 }}
                               >
                                 🔢 Numerar Nombres
                               </Button>
                             </>
                           )}
                           
                           {/* Acciones generales */}
                           <Button 
                             variant="outline" 
                             size="sm"
                             onClick={() => {
                               // Fusionar duplicados (mantener el que tenga más información)
                               const skuGroups = new Map<string, PreviewItem[]>();
                               
                               // Agrupar por SKU
                               previewData.forEach(item => {
                                 if (item.warnings?.duplicateSku && item.sku) {
                                   if (!skuGroups.has(item.sku)) {
                                     skuGroups.set(item.sku, []);
                                   }
                                   skuGroups.get(item.sku)?.push(item);
                                 }
                               });
                               
                               // Crear lista de items únicos
                               const mergedData = [...previewData];
                               let mergedCount = 0;
                               
                               skuGroups.forEach((duplicates, sku) => {
                                 if (duplicates.length > 1) {
                                   // Encontrar el item con más información (menos nulls)
                                   const bestItem = duplicates.reduce((best, current) => {
                                     const bestNonNulls = Object.values(best).filter(v => v !== null && v !== '').length;
                                     const currentNonNulls = Object.values(current).filter(v => v !== null && v !== '').length;
                                     return currentNonNulls > bestNonNulls ? current : best;
                                   });
                                   
                                   // Fusionar información de todos los duplicados
                                   const mergedItem = { ...bestItem };
                                   duplicates.forEach(item => {
                                     Object.keys(item).forEach(key => {
                                       if ((mergedItem as any)[key] === null || (mergedItem as any)[key] === '') {
                                         (mergedItem as any)[key] = (item as any)[key];
                                       }
                                     });
                                   });
                                   
                                   mergedItem.warnings = {
                                     ...mergedItem.warnings,
                                     duplicateSku: false
                                   };
                                   
                                   // Reemplazar en el array
                                   const firstIndex = mergedData.findIndex(item => item.sku === sku);
                                   if (firstIndex !== -1) {
                                     mergedData[firstIndex] = mergedItem;
                                     
                                     // Eliminar los demás duplicados
                                     for (let i = mergedData.length - 1; i >= 0; i--) {
                                       if (i !== firstIndex && mergedData[i].sku === sku && mergedData[i].warnings?.duplicateSku) {
                                         mergedData.splice(i, 1);
                                         mergedCount++;
                                       }
                                     }
                                   }
                                 }
                               });
                               
                               setPreviewData(mergedData);
                               toast.success("Duplicados fusionados", {
                                 description: `Se fusionaron ${mergedCount} productos duplicados conservando la mejor información`
                               });
                             }}
                           >
                             🔀 Fusionar Inteligente
                           </Button>
                           
                           <Button 
                             variant="outline" 
                             size="sm"
                             onClick={() => {
                               // Limpiar todas las advertencias de duplicados
                               const updatedData = previewData.map(item => ({
                                 ...item,
                                 warnings: {
                                   ...item.warnings,
                                   duplicateSku: false,
                                   duplicateName: false
                                 }
                               }));
                               setPreviewData(updatedData);
                               toast.success("Advertencias ocultadas", {
                                 description: "Se ocultaron todas las advertencias de duplicados"
                               });
                             }}
                           >
                             👁️ Ocultar Advertencias
                           </Button>
                           
                           <Button 
                             variant="destructive" 
                             size="sm"
                             onClick={() => {
                               // Eliminar TODOS los productos duplicados
                               const updatedData = previewData.filter(item => 
                                 !item.warnings?.duplicateSku && !item.warnings?.duplicateName
                               );
                               
                               const removedCount = previewData.length - updatedData.length;
                               setPreviewData(updatedData);
                               toast.success("Todos los duplicados eliminados", {
                                 description: `Se eliminaron ${removedCount} productos duplicados`
                               });
                             }}
                           >
                             🗑️ Eliminar Todos
                  </Button>
                </div>
              </div>
                    </div>
                  );
                }
                return null;
              })()}
              
              <div className="border rounded-md">
                <ScrollArea className="h-[500px]">
                  <UITable>
                    <TableHeader>
                      <TableRow>
                        <TableHead key="head-row" className="w-16 text-center">Fila</TableHead>
                        <TableHead key="head-sku">SKU</TableHead>
                        <TableHead key="head-price">Precio</TableHead>
                        <TableHead key="head-cost">Costo</TableHead>
                        <TableHead key="head-quantity">Cantidad</TableHead>
                        <TableHead key="head-category">Categoría</TableHead>
                        <TableHead key="head-location">Ubicación</TableHead>
                        <TableHead key="head-description">Descripción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((item, index) => (
                        <TableRow 
                          key={index}
                          className={item.warnings?.duplicateSku ? 
                            "bg-orange-100 border-l-4 border-l-orange-500" : ""}
                        >
                          <TableCell key={`cell-row-${index}`} className={`text-center font-medium ${item.warnings?.duplicateSku ? "text-orange-700" : ""}`}>
                            {item.rowId}
                          </TableCell>
                          <TableCell key={`cell-sku-${index}`}>
                            <div className="flex items-center">
                              <Input
                                value={item.sku || ''}
                                onChange={(e) => updatePreviewItem(index, 'sku', e.target.value)}
                                className={`
                                  ${item.confidence.sku < 0.5 ? "border-yellow-500" : ""} 
                                  ${item.warnings?.invalid ? "border-red-500 bg-red-50" : ""}
                                  ${item.warnings?.duplicateSku ? "border-orange-500 bg-orange-50 text-orange-800 font-medium" : ""}
                                  ${item.warnings?.existingSku ? "border-blue-500 bg-blue-50" : ""}
                                `}
                              />
                              {item.confidence.sku < 0.8 && renderConfidenceBadge(item.confidence.sku)}
                              {item.warnings?.duplicateSku && (
                                <TooltipProvider key={`tooltip-provider-${item.id}-sku`}>
                                  <Tooltip>
                                    <TooltipTrigger key={`tooltip-trigger-${item.id}-sku`} asChild>
                                      <AlertCircle className="h-5 w-5 text-orange-600 ml-2" />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-700">
                                      <p className="font-medium text-orange-800 dark:text-orange-200">SKU duplicado: {
                                        previewData
                                          .filter(otherItem => 
                                            otherItem.sku === item.sku && 
                                            otherItem.rowId !== item.rowId
                                          )
                                          .map(otherItem => `Fila ${otherItem.rowId}`)
                                          .join(', ')
                                      }</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              {item.warnings?.existingSku && (
                                <TooltipProvider key={`tooltip-provider-${item.id}-existing`}>
                                  <Tooltip>
                                    <TooltipTrigger key={`tooltip-trigger-${item.id}-existing`} asChild>
                                      <AlertCircle className="h-5 w-5 text-blue-600 ml-2" />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-700">
                                      <p className="font-medium text-blue-800 dark:text-blue-200">SKU ya existe en la base de datos</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            {/* Campo oculto para mantener el nombre */}
                            <Input
                              type="hidden"
                              value={item.name || ''}
                              onChange={(e) => updatePreviewItem(index, 'name', e.target.value)}
                            />
                          </TableCell>
                          <TableCell key={`cell-price-${index}`}>
                            <div className="flex items-center">
                              <Input
                                type="number"
                                value={item.price !== null ? item.price : ''}
                                onChange={(e) => updatePreviewItem(index, 'price', e.target.value ? parseFloat(e.target.value) : null)}
                                className={`${item.price !== null && item.confidence.price < 0.5 ? "border-yellow-500" : ""}
                                  ${item.warnings?.negativeValues && item.price !== null && item.price < 0 ? "border-red-500 bg-red-50" : ""}`}
                              />
                              {item.price !== null && item.confidence.price < 0.8 && renderConfidenceBadge(item.confidence.price)}
                              {item.warnings?.negativeValues && item.price !== null && item.price < 0 && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <AlertCircle className="h-4 w-4 text-red-500 ml-2" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Precio negativo</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </TableCell>
                          <TableCell key={`cell-cost-${index}`}>
                            <div className="flex items-center">
                              <Input
                                type="number"
                                value={item.cost !== null ? item.cost : ''}
                                onChange={(e) => updatePreviewItem(index, 'cost', e.target.value ? parseFloat(e.target.value) : null)}
                                className={`${item.cost !== null && item.confidence.cost < 0.5 ? "border-yellow-500" : ""}
                                  ${item.warnings?.negativeValues && item.cost !== null && item.cost < 0 ? "border-red-500 bg-red-50" : ""}`}
                              />
                              {item.cost !== null && item.confidence.cost < 0.8 && renderConfidenceBadge(item.confidence.cost)}
                              {item.warnings?.negativeValues && item.cost !== null && item.cost < 0 && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <AlertCircle className="h-4 w-4 text-red-500 ml-2" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Costo negativo</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </TableCell>
                          <TableCell key={`cell-quantity-${index}`}>
                            <div className="flex items-center">
                              <Input
                                type="number"
                                value={item.quantity !== null ? item.quantity : ''}
                                onChange={(e) => updatePreviewItem(index, 'quantity', e.target.value ? parseFloat(e.target.value) : null)}
                                className={`${item.quantity !== null && item.confidence.quantity < 0.5 ? "border-yellow-500" : ""}
                                  ${item.warnings?.invalid && item.quantity !== null && item.quantity < 0 ? "border-red-500 bg-red-50" : ""}`}
                              />
                              {item.quantity !== null && item.confidence.quantity < 0.8 && renderConfidenceBadge(item.confidence.quantity)}
                              {item.warnings?.invalid && item.quantity !== null && item.quantity < 0 && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <AlertCircle className="h-4 w-4 text-red-500 ml-2" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Cantidad negativa</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </TableCell>
                          <TableCell key={`cell-category-${index}`}>
                            <div className="flex items-center">
                              <Input
                                value={item.category || ''}
                                onChange={(e) => updatePreviewItem(index, 'category', e.target.value)}
                                className={`${item.category !== null && item.confidence.category < 0.5 ? "border-yellow-500" : ""}
                                  ${item.warnings?.invalid && item.category !== null ? "border-red-500 bg-red-50" : ""}`}
                              />
                              {item.category !== null && item.confidence.category < 0.8 && renderConfidenceBadge(item.confidence.category)}
                              {item.warnings?.invalid && item.category !== null && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <AlertCircle className="h-4 w-4 text-red-500 ml-2" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Categoría inválida o vacía</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </TableCell>
                          <TableCell key={`cell-location-${index}`}>
                            <div className="flex items-center">
                              <Input
                                value={item.location || ''}
                                onChange={(e) => updatePreviewItem(index, 'location', e.target.value)}
                                className={`${item.location !== null && item.confidence.location < 0.5 ? "border-yellow-500" : ""}
                                  ${item.warnings?.invalid && item.location !== null ? "border-red-500 bg-red-50" : ""}`}
                              />
                              {item.location !== null && item.confidence.location < 0.8 && renderConfidenceBadge(item.confidence.location)}
                              {item.warnings?.invalid && item.location !== null && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <AlertCircle className="h-4 w-4 text-red-500 ml-2" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Ubicación inválida o vacía</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </TableCell>
                          <TableCell key={`cell-description-${index}`}>
                            <div className="flex items-center">
                              <Input
                                value={item.description || ''}
                                onChange={(e) => updatePreviewItem(index, 'description', e.target.value)}
                                className={`${item.confidence.description < 0.5 ? "border-yellow-500" : ""}`}
                              />
                              {item.confidence.description < 0.8 && renderConfidenceBadge(item.confidence.description)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </UITable>
                </ScrollArea>
              </div>
            </div>
            
            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={() => setStage('mapping')}>
                Volver al Mapeo
              </Button>
              <Button onClick={handleCommitImport}>
                Importar Datos
              </Button>
            </div>
          </div>
        );
        
      case 'importing':
        return (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <h3 className="text-xl font-semibold mb-2">Importando datos al inventario...</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Estamos procesando {previewData.length} productos para actualizar el inventario
            </p>
            <Progress value={progress} className="w-full max-w-md" />
            <p className="text-xs text-muted-foreground mt-2">{progress}% completado</p>
          </div>
        );
        
      case 'complete':
        return (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">¡Importación Completada!</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Se han procesado todos los productos en el archivo
            </p>
            
            <div className="grid grid-cols-4 gap-4 w-full max-w-lg mb-8">
              <div className="bg-muted p-4 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{importStats.total}</p>
              </div>
              <div className="bg-green-100 p-4 rounded-lg text-center">
                <p className="text-sm text-green-700">Exitosos</p>
                <p className="text-2xl font-bold text-green-700">{importStats.success}</p>
              </div>
              <div className="bg-yellow-100 p-4 rounded-lg text-center">
                <p className="text-sm text-yellow-700">Advertencias</p>
                <p className="text-2xl font-bold text-yellow-700">{importStats.warning}</p>
              </div>
              <div className="bg-red-100 p-4 rounded-lg text-center">
                <p className="text-sm text-red-700">Errores</p>
                <p className="text-2xl font-bold text-red-700">{importStats.error}</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <Button variant="outline" onClick={handleReset}>
                Nueva Importación
              </Button>
              <Button onClick={() => window.location.href = '/inventory'}>
                Ir a Inventario
              </Button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Importar Productos desde Excel</CardTitle>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}
          
          {renderStageContent()}
        </CardContent>
      </Card>
  );
} 