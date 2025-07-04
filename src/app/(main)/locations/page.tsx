'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2, MapPin, Package, BarChart3, TrendingUp, AlertCircle, Building } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface LocationMetrics {
  totalLocations: number;
  activeLocations: number;
  totalItems: number;
  averageItemsPerLocation: number;
  topLocation: string;
  emptyLocations: number;
  utilizationRate: number;
}

interface Location {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    inventoryItems: number;
  };
}

export default function LocationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [locations, setLocations] = useState<Location[]>([]);
  const [metrics, setMetrics] = useState<LocationMetrics>({
    totalLocations: 0,
    activeLocations: 0,
    totalItems: 0,
    averageItemsPerLocation: 0,
    topLocation: '',
    emptyLocations: 0,
    utilizationRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/locations');
      const data = await response.json();
      
      if (data.success) {
        const locationsData = data.locations || [];
        setLocations(locationsData);
        calculateMetrics(locationsData);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch locations',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch locations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (locationsData: Location[]) => {
    const totalLocations = locationsData.length;
    const activeLocations = locationsData.filter(loc => loc.isActive).length;
    const totalItems = locationsData.reduce((sum, loc) => sum + (loc._count?.inventoryItems || 0), 0);
    const averageItemsPerLocation = totalLocations > 0 ? totalItems / totalLocations : 0;
    const emptyLocations = locationsData.filter(loc => (loc._count?.inventoryItems || 0) === 0).length;
    const utilizationRate = totalLocations > 0 ? ((totalLocations - emptyLocations) / totalLocations) * 100 : 0;
    
    // Find top location by item count
    const topLocation = locationsData.reduce((top, current) => {
      const currentCount = current._count?.inventoryItems || 0;
      const topCount = top._count?.inventoryItems || 0;
      return currentCount > topCount ? current : top;
    }, locationsData[0] || null);

    setMetrics({
      totalLocations,
      activeLocations,
      totalItems,
      averageItemsPerLocation,
      topLocation: topLocation?.name || 'N/A',
      emptyLocations,
      utilizationRate
    });
  };

  const getFilteredLocations = () => {
    return locations.filter(location => {
      // Search filter
      const matchesSearch = !searchTerm || 
        location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && location.isActive) ||
        (statusFilter === 'inactive' && !location.isActive);
      
      return matchesSearch && matchesStatus;
    });
  };

  const handleDeleteLocation = async (locationId: string, locationName: string) => {
    try {
      const response = await fetch(`/api/locations/${locationId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const updatedLocations = locations.filter(loc => loc.id !== locationId);
        setLocations(updatedLocations);
        calculateMetrics(updatedLocations);
        toast({
          title: 'Success',
          description: `Location "${locationName}" deleted successfully`
        });
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete location',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete location',
        variant: 'destructive'
      });
    }
  };

  const getUtilizationColor = (itemCount: number) => {
    if (itemCount === 0) return 'text-red-600';
    if (itemCount < 5) return 'text-yellow-600';
    if (itemCount < 20) return 'text-blue-600';
    return 'text-green-600';
  };

  const getUtilizationLevel = (itemCount: number) => {
    if (itemCount === 0) return 'Empty';
    if (itemCount < 5) return 'Low';
    if (itemCount < 20) return 'Medium';
    return 'High';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading locations dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const filteredLocations = getFilteredLocations();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Locations Dashboard</h1>
          <p className="text-muted-foreground">
            Manage storage locations and track inventory distribution
          </p>
        </div>
        <Button onClick={() => router.push('/locations/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Location
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalLocations}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.activeLocations} active locations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalItems}</div>
            <p className="text-xs text-muted-foreground">
              Distributed across all locations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {metrics.utilizationRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Locations with inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Items/Location</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics.averageItemsPerLocation.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average distribution
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Location</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {metrics.topLocation}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Location with most inventory items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Location Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Active:</span>
                <Badge variant="default">{metrics.activeLocations}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Inactive:</span>
                <Badge variant="secondary">{metrics.totalLocations - metrics.activeLocations}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Empty:</span>
                <Badge variant="destructive">{metrics.emptyLocations}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Utilization Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Utilization Rate</span>
                  <span>{metrics.utilizationRate.toFixed(1)}%</span>
                </div>
                <Progress value={metrics.utilizationRate} className="h-2" />
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.emptyLocations > 0 && `${metrics.emptyLocations} locations need attention`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search Locations</label>
              <Input
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Status Filter</label>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">All Locations</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Locations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Locations ({filteredLocations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Utilization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLocations.map((location) => {
                const itemCount = location._count?.inventoryItems || 0;
                const utilizationLevel = getUtilizationLevel(itemCount);
                const utilizationColor = getUtilizationColor(itemCount);
                
                return (
                  <TableRow key={location.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <div>
                          <div className="font-medium">{location.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {location.description || 'No description'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{itemCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={utilizationColor}>
                        {utilizationLevel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={location.isActive ? 'default' : 'secondary'}>
                        {location.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(location.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/locations/edit/${location.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Location</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{location.name}"?
                                {itemCount > 0 && (
                                  <span className="text-red-600 block mt-2">
                                    ⚠️ This location contains {itemCount} inventory items.
                                  </span>
                                )}
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteLocation(location.id, location.name)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {filteredLocations.length === 0 && (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No locations found matching your criteria.' 
                  : 'No locations found. Create your first location to get started.'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button className="mt-4" onClick={() => router.push('/locations/new')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Location
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 