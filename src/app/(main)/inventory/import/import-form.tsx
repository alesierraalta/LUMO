"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, FileUp, AlertCircle, Table, CheckCircle2, Loader2 } from "lucide-react";
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

type ProcessingStage = 'idle' | 'uploading' | 'parsing' | 'analyzing' | 'mapping' | 'preview' | 'importing' | 'complete';

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
  confidence: {
    name: number;
    sku: number;
    price: number;
    cost: number;
    quantity: number;
    category: number;
    location: number;
  };
  originalData: Record<string, any>;
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

  // Trigger file input click
  const handleClickUpload = () => {
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

  // Upload and process the file
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("No hay archivo seleccionado", {
        description: "Por favor selecciona un archivo para importar"
      });
      return;
    }

    setStage('uploading');
    setProgress(10);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('userId', userId);
      if (notes) formData.append('notes', notes);

      // Upload file
      const uploadResponse = await fetch('/api/inventory/import/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.message || "Error al subir el archivo");
      }

      setProgress(30);
      setStage('parsing');

      const uploadResult = await uploadResponse.json();
      const { sessionId, columns } = uploadResult;

      // Set the Excel columns for mapping
      setExcelColumns(columns);
      
      // Process with NLP
      setStage('analyzing');
      setProgress(50);

      const processResponse = await fetch('/api/inventory/import/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          userId,
        }),
      });

      if (!processResponse.ok) {
        const errorData = await processResponse.json();
        throw new Error(errorData.message || "Error al procesar el archivo");
      }

      const processResult = await processResponse.json();
      const { mappings: suggestedMappings, preview } = processResult;

      setMappings(suggestedMappings);
      setPreviewData(preview);
      
      setProgress(100);
      setStage('mapping');

    } catch (error) {
      console.error("Error during import:", error);
      setErrorMessage(error instanceof Error ? error.message : "Error desconocido durante la importación");
      setStage('idle');
      toast.error("Error al procesar el archivo", {
        description: error instanceof Error ? error.message : "Ocurrió un error al procesar el archivo"
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
  const handleProceedToPreview = () => {
    // Validate that all required fields are mapped
    const requiredFields = ['name', 'sku', 'quantity'];
    const mappedFields = mappings.filter(m => m.inventoryField).map(m => m.inventoryField);
    
    const missingFields = requiredFields.filter(field => !mappedFields.includes(field));
    
    if (missingFields.length > 0) {
      toast.error("Faltan campos requeridos", {
        description: `Por favor mapea los siguientes campos: ${missingFields.join(', ')}`
      });
      return;
    }
    
    setStage('preview');
  };

  // Import the data
  const handleImport = async () => {
    setStage('importing');
    setProgress(10);
    
    try {
      // Validate the preview data
      const invalidItems = previewData.filter(item => {
        return !item.name || !item.sku || item.quantity === null;
      });
      
      if (invalidItems.length > 0) {
        toast.error("Datos inválidos", {
          description: `Hay ${invalidItems.length} productos con datos inválidos o incompletos`
        });
        setStage('preview');
        return;
      }
      
      setProgress(30);
      
      // Send the data for import
      const importResponse = await fetch('/api/inventory/import/commit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          items: previewData,
          notes,
        }),
      });
      
      if (!importResponse.ok) {
        const errorData = await importResponse.json();
        throw new Error(errorData.message || "Error al importar los datos");
      }
      
      setProgress(70);
      
      const importResult = await importResponse.json();
      const { success, warning, error, total } = importResult;
      
      setImportStats({
        total,
        success,
        warning,
        error
      });
      
      setProgress(100);
      setStage('complete');
      
      toast.success("Importación completada", {
        description: `Se procesaron ${total} productos: ${success} exitosos, ${warning} con advertencias, ${error} con errores`
      });
      
    } catch (error) {
      console.error("Error during import:", error);
      setErrorMessage(error instanceof Error ? error.message : "Error desconocido durante la importación");
      setStage('preview');
      toast.error("Error al importar los datos", {
        description: error instanceof Error ? error.message : "Ocurrió un error al importar los datos"
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
          <div 
            className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary/50 transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="mx-auto flex flex-col items-center justify-center gap-4">
              <div className="rounded-full bg-primary/10 p-4">
                <Upload className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Arrastra un archivo o haz clic para seleccionar</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Selecciona un archivo Excel (.xlsx, .xls) o CSV para importar. El sistema usará NLP para extraer información de datos incompletos.
              </p>
              <Button 
                onClick={handleClickUpload} 
                className="mt-2"
              >
                <FileUp className="mr-2 h-4 w-4" />
                Seleccionar Archivo
              </Button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                className="hidden" 
                accept=".xlsx,.xls,.csv"
              />
              {selectedFile && (
                <div className="mt-4 text-sm">
                  <span className="font-medium">Archivo seleccionado:</span> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>
            
            <div className="mt-8">
              <Label htmlFor="notes" className="text-left block mb-2">Notas de Importación (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Agrega notas o comentarios sobre esta importación..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mb-4"
              />
              
              <Button 
                onClick={handleUpload} 
                disabled={!selectedFile}
                className="w-full mt-4"
              >
                Iniciar Importación
              </Button>
            </div>
          </div>
        );
        
      case 'uploading':
      case 'parsing':
      case 'analyzing':
        return (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {stage === 'uploading' ? 'Subiendo archivo...' : 
               stage === 'parsing' ? 'Analizando estructura del archivo...' : 
               'Procesando datos con NLP...'}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {stage === 'uploading' ? 'Subiendo el archivo al servidor' : 
               stage === 'parsing' ? 'Leyendo columnas y contenido' : 
               'Extrayendo información de datos incompletos con NLP'}
            </p>
            <Progress value={progress} className="w-full max-w-md" />
            <p className="text-xs text-muted-foreground mt-2">{progress}% completado</p>
          </div>
        );
        
      case 'mapping':
        return (
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4">Mapeo de Columnas</h3>
            <p className="text-sm text-muted-foreground mb-6">
              El sistema ha detectado las siguientes columnas en tu archivo. Por favor, verifica y ajusta el mapeo según sea necesario.
            </p>
            
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
                            <SelectItem value="">No mapear</SelectItem>
                            <SelectItem value="name">Nombre</SelectItem>
                            <SelectItem value="sku">SKU</SelectItem>
                            <SelectItem value="price">Precio</SelectItem>
                            <SelectItem value="cost">Costo</SelectItem>
                            <SelectItem value="quantity">Cantidad</SelectItem>
                            <SelectItem value="category">Categoría</SelectItem>
                            <SelectItem value="location">Ubicación</SelectItem>
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
                            className={item.confidence.name < 0.5 ? "border-yellow-500" : ""}
                          />
                          {item.confidence.name < 0.8 && renderConfidenceBadge(item.confidence.name)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Input
                            value={item.sku || ''}
                            onChange={(e) => updatePreviewItem(index, 'sku', e.target.value)}
                            className={item.confidence.sku < 0.5 ? "border-yellow-500" : ""}
                          />
                          {item.confidence.sku < 0.8 && renderConfidenceBadge(item.confidence.sku)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Input
                            type="number"
                            value={item.price !== null ? item.price : ''}
                            onChange={(e) => updatePreviewItem(index, 'price', e.target.value ? parseFloat(e.target.value) : null)}
                            className={item.price !== null && item.confidence.price < 0.5 ? "border-yellow-500" : ""}
                          />
                          {item.price !== null && item.confidence.price < 0.8 && renderConfidenceBadge(item.confidence.price)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Input
                            type="number"
                            value={item.cost !== null ? item.cost : ''}
                            onChange={(e) => updatePreviewItem(index, 'cost', e.target.value ? parseFloat(e.target.value) : null)}
                            className={item.cost !== null && item.confidence.cost < 0.5 ? "border-yellow-500" : ""}
                          />
                          {item.cost !== null && item.confidence.cost < 0.8 && renderConfidenceBadge(item.confidence.cost)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Input
                            type="number"
                            value={item.quantity !== null ? item.quantity : ''}
                            onChange={(e) => updatePreviewItem(index, 'quantity', e.target.value ? parseFloat(e.target.value) : null)}
                            className={item.quantity !== null && item.confidence.quantity < 0.5 ? "border-yellow-500" : ""}
                          />
                          {item.quantity !== null && item.confidence.quantity < 0.8 && renderConfidenceBadge(item.confidence.quantity)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Input
                            value={item.category || ''}
                            onChange={(e) => updatePreviewItem(index, 'category', e.target.value)}
                            className={item.category !== null && item.confidence.category < 0.5 ? "border-yellow-500" : ""}
                          />
                          {item.category !== null && item.confidence.category < 0.8 && renderConfidenceBadge(item.confidence.category)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Input
                            value={item.location || ''}
                            onChange={(e) => updatePreviewItem(index, 'location', e.target.value)}
                            className={item.location !== null && item.confidence.location < 0.5 ? "border-yellow-500" : ""}
                          />
                          {item.location !== null && item.confidence.location < 0.8 && renderConfidenceBadge(item.confidence.location)}
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
              <Button onClick={handleImport}>
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