"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit, 
  Trash, 
  MapPin, 
  Package,
  Search
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

type Location = {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    inventory: number;
  };
};

type LocationsClientProps = {
  initialLocations: Location[];
};

export default function LocationsClient({ initialLocations }: LocationsClientProps) {
  const [locations, setLocations] = useState<Location[]>(initialLocations);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Filter locations based on search
  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (location.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const resetForm = () => {
    setName("");
    setDescription("");
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("El nombre de la ubicación es requerido");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/locations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear la ubicación");
      }

      const newLocation = await response.json();
      setLocations(prev => [newLocation, ...prev]);
      setIsCreateOpen(false);
      resetForm();
      toast.success("Ubicación creada exitosamente");
    } catch (error) {
      console.error("Error creating location:", error);
      toast.error(error instanceof Error ? error.message : "Error al crear la ubicación");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setName(location.name);
    setDescription(location.description || "");
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingLocation || !name.trim()) {
      toast.error("El nombre de la ubicación es requerido");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/locations/${editingLocation.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          isActive: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar la ubicación");
      }

      const updatedLocation = await response.json();
      setLocations(prev => 
        prev.map(loc => loc.id === updatedLocation.id ? updatedLocation : loc)
      );
      setIsEditOpen(false);
      setEditingLocation(null);
      resetForm();
      toast.success("Ubicación actualizada exitosamente");
    } catch (error) {
      console.error("Error updating location:", error);
      toast.error(error instanceof Error ? error.message : "Error al actualizar la ubicación");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (location: Location) => {
    const confirmed = window.confirm(
      `¿Estás seguro de que quieres eliminar la ubicación "${location.name}"?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/locations/${location.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar la ubicación");
      }

      setLocations(prev => prev.filter(loc => loc.id !== location.id));
      toast.success("Ubicación eliminada exitosamente");
    } catch (error) {
      console.error("Error deleting location:", error);
      toast.error(error instanceof Error ? error.message : "Error al eliminar la ubicación");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con búsqueda y botón crear */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar ubicaciones..."
            className="pl-9 w-full sm:w-[300px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nueva Ubicación
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Ubicación</DialogTitle>
              <DialogDescription>
                Agrega una nueva ubicación para organizar tu inventario
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre de la Ubicación</Label>
                <Input
                  id="name"
                  placeholder="Ej: Almacén Principal, Bodega A..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="description">Descripción (Opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Descripción de la ubicación..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleCreate}
                disabled={isLoading}
              >
                {isLoading ? "Creando..." : "Crear Ubicación"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla de ubicaciones */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ubicación</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha de Creación</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLocations.map((location) => (
              <TableRow key={location.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {location.name}
                  </div>
                </TableCell>
                <TableCell>
                  {location.description ? (
                    <span className="text-sm">{location.description}</span>
                  ) : (
                    <span className="text-muted-foreground text-sm italic">Sin descripción</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span>{location._count.inventory}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={location.isActive ? "default" : "secondary"}>
                    {location.isActive ? "Activa" : "Inactiva"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {formatDate(location.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(location)}
                      disabled={isLoading}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(location)}
                      disabled={isLoading || location._count.inventory > 0}
                      title={location._count.inventory > 0 ? 
                        "No se puede eliminar porque tiene productos asignados" : 
                        "Eliminar ubicación"
                      }
                    >
                      <Trash className="h-4 w-4 mr-1" />
                      Eliminar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredLocations.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {searchQuery ? "No se encontraron ubicaciones que coincidan con la búsqueda." : "No hay ubicaciones creadas aún."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal de edición */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Ubicación</DialogTitle>
            <DialogDescription>
              Modifica los detalles de la ubicación
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nombre de la Ubicación</Label>
              <Input
                id="edit-name"
                placeholder="Ej: Almacén Principal, Bodega A..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Descripción (Opcional)</Label>
              <Textarea
                id="edit-description"
                placeholder="Descripción de la ubicación..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditOpen(false);
                setEditingLocation(null);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdate}
              disabled={isLoading}
            >
              {isLoading ? "Actualizando..." : "Actualizar Ubicación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 