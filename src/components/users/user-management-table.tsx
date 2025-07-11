'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Download,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Users,
  Calendar,
  Mail,
  Shield,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  role: {
    id: string;
    name: string;
    description?: string;
  } | null;
}

interface FilterOptions {
  role: string;
  status: string;
}

interface SortOption {
  column: keyof User | 'role.name';
  direction: 'asc' | 'desc';
}

const ITEMS_PER_PAGE = 10;

const UserManagementTable = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({ role: '', status: '' });
  const [sortOption, setSortOption] = useState<SortOption>({ column: 'name', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  // Enhanced helper function to get auth headers with development mode fallback
  const getAuthHeaders = useCallback(async () => {
    try {
      const { getSupabaseClient } = await import('@/lib/supabase-singleton');
      const supabase = getSupabaseClient();
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        // Development mode fallback
        if (process.env.NODE_ENV === 'development') {
          return {
            'Content-Type': 'application/json',
            'X-Development-Mode': 'true'
          };
        }
        throw new Error('Authentication required');
      }
      
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      };
    } catch (error) {
      // Development mode fallback
      if (process.env.NODE_ENV === 'development') {
        return {
          'Content-Type': 'application/json',
          'X-Development-Mode': 'true'
        };
      }
      throw error;
    }
  }, []);

  // Load users data
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 [UserManagementTable] Loading users...');
      
      const headers = await getAuthHeaders();
      const response = await fetch('/api/users', { headers });
      
      if (!response.ok) {
        throw new Error(`Failed to load users: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.users) {
        setUsers(data.users);
        console.log('✅ [UserManagementTable] Users loaded:', data.users.length);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ [UserManagementTable] Error loading users:', error);
      toast({
        title: "Error",
        description: `Error al cargar usuarios: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, toast]);

  // Initial load
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(user => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Role filter
      const matchesRole = filters.role === '' || user.role?.name === filters.role;
      
      // Status filter
      const matchesStatus = filters.status === '' || 
        (filters.status === 'active' && user.isActive) ||
        (filters.status === 'inactive' && !user.isActive);
      
      return matchesSearch && matchesRole && matchesStatus;
    });

    // Sort users
    filtered.sort((a, b) => {
      let valueA, valueB;
      
      if (sortOption.column === 'role.name') {
        valueA = a.role?.name || '';
        valueB = b.role?.name || '';
      } else {
        valueA = a[sortOption.column as keyof User] || '';
        valueB = b[sortOption.column as keyof User] || '';
      }
      
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }
      
      if (valueA < valueB) return sortOption.direction === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortOption.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [users, searchTerm, filters, sortOption]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredAndSortedUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  // Handle sorting
  const handleSort = (column: keyof User | 'role.name') => {
    setSortOption(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle delete user
  const handleDeleteUser = async (userId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to delete user: ${response.status}`);
      }

      toast({
        title: "Éxito",
        description: "Usuario eliminado correctamente",
      });
      
      // Reload users
      loadUsers();
      setShowDeleteDialog(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('❌ [UserManagementTable] Error deleting user:', error);
      toast({
        title: "Error",
        description: `Error al eliminar usuario: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Handle export
  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      setExporting(true);
      
      if (format === 'csv') {
        const csvContent = [
          ['Nombre', 'Email', 'Rol', 'Estado', 'Fecha de Registro'].join(','),
          ...filteredAndSortedUsers.map(user => [
            user.name,
            user.email,
            user.role?.name || 'Sin rol',
            user.isActive ? 'Activo' : 'Inactivo',
            new Date(user.createdAt).toLocaleDateString()
          ].join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `usuarios_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Éxito",
          description: "Archivo CSV descargado correctamente",
        });
      } else if (format === 'pdf') {
        // For PDF export, we would typically use a library like jsPDF
        // For now, we'll show a placeholder
        toast({
          title: "Funcionalidad en desarrollo",
          description: "La exportación a PDF estará disponible próximamente",
        });
      }
    } catch (error) {
      console.error('❌ [UserManagementTable] Error exporting:', error);
      toast({
        title: "Error",
        description: `Error al exportar: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  // Get role badge variant
  const getRoleBadgeVariant = (roleName: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (roleName) {
      case 'ADMIN':
        return 'destructive';
      case 'MANAGER':
        return 'default';
      case 'USER':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Cargando usuarios...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <CardTitle>Lista de Usuarios</CardTitle>
              <Badge variant="outline" className="ml-2">
                {filteredAndSortedUsers.length} {filteredAndSortedUsers.length === 1 ? 'usuario' : 'usuarios'}
              </Badge>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                asChild 
                className="flex items-center gap-2"
                aria-label="Agregar nuevo usuario"
              >
                <Link href="/settings/users/new">
                  <Plus className="h-4 w-4" />
                  Agregar Usuario
                </Link>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    disabled={exporting}
                    aria-label="Exportar datos"
                  >
                    {exporting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Exportar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleExport('csv')}>
                    Exportar como CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    Exportar como PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, email o rol..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  aria-label="Buscar usuarios"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={filters.role || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, role: value === 'all' ? '' : value }))}>
                <SelectTrigger className="w-[150px]" aria-label="Filtrar por rol">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Todos los roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="MANAGER">Gerente</SelectItem>
                  <SelectItem value="USER">Usuario</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.status || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? '' : value }))}>
                <SelectTrigger className="w-[150px]" aria-label="Filtrar por estado">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-1 font-medium"
                        aria-label="Ordenar por nombre"
                      >
                        <Users className="h-4 w-4" />
                        Nombre
                        {sortOption.column === 'name' && (
                          sortOption.direction === 'asc' ? 
                            <SortAsc className="h-4 w-4" /> : 
                            <SortDesc className="h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="min-w-[200px]">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('email')}
                        className="flex items-center gap-1 font-medium"
                        aria-label="Ordenar por email"
                      >
                        <Mail className="h-4 w-4" />
                        Email
                        {sortOption.column === 'email' && (
                          sortOption.direction === 'asc' ? 
                            <SortAsc className="h-4 w-4" /> : 
                            <SortDesc className="h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="min-w-[120px]">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('role.name')}
                        className="flex items-center gap-1 font-medium"
                        aria-label="Ordenar por rol"
                      >
                        <Shield className="h-4 w-4" />
                        Rol
                        {sortOption.column === 'role.name' && (
                          sortOption.direction === 'asc' ? 
                            <SortAsc className="h-4 w-4" /> : 
                            <SortDesc className="h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="min-w-[100px]">Estado</TableHead>
                    <TableHead className="min-w-[140px]">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('createdAt')}
                        className="flex items-center gap-1 font-medium"
                        aria-label="Ordenar por fecha de registro"
                      >
                        <Calendar className="h-4 w-4" />
                        Registro
                        {sortOption.column === 'createdAt' && (
                          sortOption.direction === 'asc' ? 
                            <SortAsc className="h-4 w-4" /> : 
                            <SortDesc className="h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="text-gray-500">
                          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium">No se encontraron usuarios</p>
                          <p className="text-sm">Intenta modificar los filtros de búsqueda</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-semibold text-sm">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span>{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {user.role ? (
                            <Badge variant={getRoleBadgeVariant(user.role.name)}>
                              {user.role.name}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Sin rol</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {user.isActive ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-green-700">Activo</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 text-red-500" />
                                <span className="text-red-700">Inactivo</span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <time dateTime={user.createdAt}>
                            {new Date(user.createdAt).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </time>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                aria-label={`Acciones para ${user.name}`}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowDetailsDialog(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Ver detalles
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/settings/users/${user.id}/edit`}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowDeleteDialog(true);
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <div className="text-sm text-gray-600">
                Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedUsers.length)} de {filteredAndSortedUsers.length} usuarios
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        "w-8 h-8 p-0",
                        currentPage === page && "bg-blue-600 text-white"
                      )}
                      aria-label={`Ir a la página ${page}`}
                      aria-current={currentPage === page ? "page" : undefined}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalles del Usuario</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-xl">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedUser.name}</h3>
                  <p className="text-gray-600">{selectedUser.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Rol</label>
                  <div className="mt-1">
                    {selectedUser.role ? (
                      <Badge variant={getRoleBadgeVariant(selectedUser.role.name)}>
                        {selectedUser.role.name}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Sin rol</Badge>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Estado</label>
                  <div className="mt-1 flex items-center gap-2">
                    {selectedUser.isActive ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-700">Activo</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-red-700">Inactivo</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Fecha de Registro</label>
                  <p className="mt-1">
                    {new Date(selectedUser.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Última Actualización</label>
                  <p className="mt-1">
                    {new Date(selectedUser.updatedAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el usuario{' '}
              <strong>{selectedUser?.name}</strong> y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedUser && handleDeleteUser(selectedUser.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManagementTable;