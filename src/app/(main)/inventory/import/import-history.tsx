"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Search,
  Download,
  FileText,
  User
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Define types
interface ImportHistoryProps {
  userId: string;
}

interface ImportSession {
  id: string;
  createdAt: string;
  fileName: string;
  status: 'completed' | 'processing' | 'failed';
  totalItems: number;
  successItems: number;
  warningItems: number;
  errorItems: number;
  notes?: string;
  createdBy: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

interface ImportSessionDetail {
  id: string;
  sessionId: string;
  name: string;
  sku: string;
  status: 'success' | 'warning' | 'error';
  message?: string;
  originalData: Record<string, any>;
  importedData: Record<string, any>;
}

export default function ImportHistory({ userId }: ImportHistoryProps) {
  const [sessions, setSessions] = useState<ImportSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<ImportSession[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [sessionDetails, setSessionDetails] = useState<ImportSessionDetail[]>([]);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);
  
  // Fetch import sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch('/api/inventory/import/history');
        
        if (!response.ok) {
          throw new Error("Error al cargar el historial de importaciones");
        }
        
        const data = await response.json();
        setSessions(data.sessions);
        setFilteredSessions(data.sessions);
        setLoading(false);
        
      } catch (error) {
        console.error("Error fetching import history:", error);
        toast.error("Error al cargar el historial", {
          description: error instanceof Error ? error.message : "No se pudo cargar el historial de importaciones"
        });
        setLoading(false);
      }
    };
    
    fetchSessions();
  }, []);
  
  // Filter sessions when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSessions(sessions);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = sessions.filter(session => 
      session.fileName.toLowerCase().includes(query) ||
      session.notes?.toLowerCase().includes(query) ||
      session.createdBy.email.toLowerCase().includes(query) ||
      (session.createdBy.firstName && session.createdBy.firstName.toLowerCase().includes(query)) ||
      (session.createdBy.lastName && session.createdBy.lastName.toLowerCase().includes(query))
    );
    
    setFilteredSessions(filtered);
  }, [searchQuery, sessions]);
  
  // Fetch session details
  const fetchSessionDetails = async (sessionId: string) => {
    setDetailsLoading(true);
    setSelectedSession(sessionId);
    
    try {
      const response = await fetch(`/api/inventory/import/history/${sessionId}`);
      
      if (!response.ok) {
        throw new Error("Error al cargar los detalles de la importación");
      }
      
      const data = await response.json();
      setSessionDetails(data.details);
      setDetailsLoading(false);
      
    } catch (error) {
      console.error("Error fetching session details:", error);
      toast.error("Error al cargar los detalles", {
        description: error instanceof Error ? error.message : "No se pudieron cargar los detalles de la importación"
      });
      setDetailsLoading(false);
    }
  };
  
  // Render status badge
  const renderStatusBadge = (status: ImportSession['status']) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle className="mr-1 h-3 w-3" /> Completado
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300">
            <Clock className="mr-1 h-3 w-3 animate-spin" /> Procesando
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            <XCircle className="mr-1 h-3 w-3" /> Fallido
          </Badge>
        );
      default:
        return null;
    }
  };
  
  // Render item status badge
  const renderItemStatusBadge = (status: ImportSessionDetail['status']) => {
    switch (status) {
      case 'success':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle className="mr-1 h-3 w-3" /> Éxito
          </Badge>
        );
      case 'warning':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <AlertTriangle className="mr-1 h-3 w-3" /> Advertencia
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            <XCircle className="mr-1 h-3 w-3" /> Error
          </Badge>
        );
      default:
        return null;
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: es });
    } catch (error) {
      return dateString;
    }
  };
  
  // Get user display name
  const getUserDisplayName = (user: ImportSession['createdBy']) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user.firstName) {
      return user.firstName;
    } else {
      return user.email;
    }
  };
  
  // Export session details as CSV
  const exportSessionDetails = (sessionId: string) => {
    if (sessionDetails.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }
    
    // Create CSV content
    const headers = ["Nombre", "SKU", "Estado", "Mensaje"];
    const csvContent = [
      headers.join(","),
      ...sessionDetails.map(detail => {
        return [
          `"${detail.name.replace(/"/g, '""')}"`,
          `"${detail.sku.replace(/"/g, '""')}"`,
          `"${detail.status}"`,
          `"${detail.message ? detail.message.replace(/"/g, '""') : ''}"`
        ].join(",");
      })
    ].join("\n");
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `import-details-${sessionId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Historial de Importaciones</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre de archivo, usuario o notas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Archivo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Resultados</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Cargando historial de importaciones...
                  </TableCell>
                </TableRow>
              ) : filteredSessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No se encontraron registros de importación
                  </TableCell>
                </TableRow>
              ) : (
                filteredSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">
                      {formatDate(session.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{session.fileName}</span>
                      </div>
                      {session.notes && (
                        <p className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">
                          {session.notes}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      {renderStatusBadge(session.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-medium">{session.totalItems} productos</span>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs text-green-600">{session.successItems} éxitos</span>
                          {session.warningItems > 0 && (
                            <span className="text-xs text-yellow-600">{session.warningItems} advertencias</span>
                          )}
                          {session.errorItems > 0 && (
                            <span className="text-xs text-red-600">{session.errorItems} errores</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{getUserDisplayName(session.createdBy)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => fetchSessionDetails(session.id)}
                          >
                            Ver Detalles
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>Detalles de Importación</DialogTitle>
                            <DialogDescription>
                              {session.fileName} - {formatDate(session.createdAt)}
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="mt-4">
                            <div className="flex justify-between mb-4">
                              <div className="flex gap-4">
                                <div className="bg-muted p-2 rounded text-center min-w-[80px]">
                                  <div className="text-xs text-muted-foreground">Total</div>
                                  <div className="font-semibold">{session.totalItems}</div>
                                </div>
                                <div className="bg-green-100 p-2 rounded text-center min-w-[80px]">
                                  <div className="text-xs text-green-700">Éxitos</div>
                                  <div className="font-semibold text-green-700">{session.successItems}</div>
                                </div>
                                <div className="bg-yellow-100 p-2 rounded text-center min-w-[80px]">
                                  <div className="text-xs text-yellow-700">Advertencias</div>
                                  <div className="font-semibold text-yellow-700">{session.warningItems}</div>
                                </div>
                                <div className="bg-red-100 p-2 rounded text-center min-w-[80px]">
                                  <div className="text-xs text-red-700">Errores</div>
                                  <div className="font-semibold text-red-700">{session.errorItems}</div>
                                </div>
                              </div>
                              
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => exportSessionDetails(session.id)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Exportar CSV
                              </Button>
                            </div>
                            
                            {session.notes && (
                              <div className="bg-muted p-3 rounded-md mb-4">
                                <div className="text-xs text-muted-foreground mb-1">Notas:</div>
                                <div className="text-sm">{session.notes}</div>
                              </div>
                            )}
                            
                            <div className="border rounded-md overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Producto</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Mensaje</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {detailsLoading ? (
                                    <TableRow>
                                      <TableCell colSpan={4} className="h-24 text-center">
                                        Cargando detalles...
                                      </TableCell>
                                    </TableRow>
                                  ) : sessionDetails.length === 0 ? (
                                    <TableRow>
                                      <TableCell colSpan={4} className="h-24 text-center">
                                        No hay detalles disponibles para esta importación
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    sessionDetails.map((detail) => (
                                      <TableRow key={detail.id}>
                                        <TableCell className="font-medium">
                                          {detail.name}
                                        </TableCell>
                                        <TableCell>
                                          {detail.sku}
                                        </TableCell>
                                        <TableCell>
                                          {renderItemStatusBadge(detail.status)}
                                        </TableCell>
                                        <TableCell>
                                          {detail.message || ''}
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
} 