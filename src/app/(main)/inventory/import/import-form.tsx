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
      const { filePath, sessionId } = await uploadResponse.json();

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
          sessionId,
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
    // @ts-ignore - This is a dynamic field access
    newPreviewData[index][field] = value;
    setPreviewData(newPreviewData);
  };

  // Proceed to preview
  const handleProceedToPreview = async () => {
    // Validate that all required fields are mapped
    const requiredFields = ['name', 'sku', 'quantity'];
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
      const duplicateSkus: string[] = [];
      
      previewData.forEach(item => {
        if (item.sku) {
          if (skus.has(item.sku)) {
            duplicateSkus.push(item.sku);
          } else {
            skus.add(item.sku);
          }
        }
      });
      
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
        !item.name || 
        item.name.trim() === '' || 
        !item.sku || 
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
        warnings.push(`Se encontraron ${duplicateSkus.length} SKUs duplicados en los datos importados.`);
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
      
      // Marcar visualmente los elementos con problemas
      const updatedPreviewData = previewData.map(item => {
        const hasDuplicateSku = duplicateSkus.includes(item.sku);
        const existingSku = existingSkus.find(e => e.sku === item.sku && e.existing);
        const isInvalid = !item.name || !item.sku || (item.quantity !== null && item.quantity < 0);
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
      
      // Crear sesión de importación
      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      formData.append('notes', notes);
      formData.append('data', JSON.stringify(previewData));
      
      // Opción de importación en segundo plano
      const importInBackground = true; // Hacer esto configurable con un checkbox
      formData.append('background', String(importInBackground));
      
      const response = await fetch('/api/inventory/import/commit', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al procesar la importación');
      }
      
      const data = await response.json();
      
      if (importInBackground) {
        // Si es en segundo plano, mostrar mensaje y redireccionar
        toast.success('Importación iniciada en segundo plano', {
          description: 'Puedes continuar trabajando mientras se procesa. Recibirás una notificación cuando finalice.'
        });
        
        // Redirigir a la página de historial de importaciones
        window.location.href = '/inventory/import/history';
      } else {
        // Si no es en segundo plano, esperar y mostrar resultados
        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await fetch(`/api/inventory/import/status/${data.sessionId}`);
            
            if (!statusResponse.ok) {
              clearInterval(pollInterval);
              throw new Error('Error al verificar estado de importación');
            }
            
            const statusData = await statusResponse.json();
            
            // Actualizar progreso
            setProgress(Math.floor((statusData.processedItems / statusData.totalItems) * 100));
            
            // Actualizar estadísticas
            setImportStats({
              total: statusData.totalItems,
              success: statusData.successItems,
              warning: statusData.warningItems,
              error: statusData.errorItems,
            });
            
            // Verificar si ha terminado
            if (statusData.status === 'completed') {
              clearInterval(pollInterval);
              setStage('completed');
              
              toast.success('Importación completada', {
                description: `${statusData.successItems} de ${statusData.totalItems} items procesados exitosamente`
              });
            }
            
          } catch (error) {
            clearInterval(pollInterval);
            console.error('Error al verificar estado:', error);
            
            toast.error('Error al verificar estado', {
              description: error instanceof Error ? error.message : 'Error desconocido'
            });
          }
        }, 2000); // Verificar cada 2 segundos
      }
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
            
            <div className="border rounded-md overflow-hidden overflow-x-auto">
              <UITable>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Costo</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Descripción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center">
                          <Input
                            value={item.name || ''}
                            onChange={(e) => updatePreviewItem(index, 'name', e.target.value)}
                            className={`${item.confidence.name < 0.5 ? "border-yellow-500" : ""} 
                              ${item.warnings?.invalid ? "border-red-500 bg-red-50" : ""}`}
                          />
                          {item.confidence.name < 0.8 && renderConfidenceBadge(item.confidence.name)}
                          {item.warnings?.invalid && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertCircle className="h-4 w-4 text-red-500 ml-2" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Nombre inválido o vacío</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Input
                            value={item.sku || ''}
                            onChange={(e) => updatePreviewItem(index, 'sku', e.target.value)}
                            className={`${item.confidence.sku < 0.5 ? "border-yellow-500" : ""} 
                              ${item.warnings?.invalid ? "border-red-500 bg-red-50" : ""}
                              ${item.warnings?.duplicateSku ? "border-orange-500 bg-orange-50" : ""}
                              ${item.warnings?.existingSku ? "border-blue-500 bg-blue-50" : ""}`}
                          />
                          {item.confidence.sku < 0.8 && renderConfidenceBadge(item.confidence.sku)}
                          {item.warnings?.duplicateSku && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertCircle className="h-4 w-4 text-orange-500 ml-2" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>SKU duplicado en los datos importados</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {item.warnings?.existingSku && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertCircle className="h-4 w-4 text-blue-500 ml-2" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>SKU ya existe en la base de datos</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
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
                      <TableCell>
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
                      <TableCell>
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
                      <TableCell>
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
                      <TableCell>
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
                      <TableCell>
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