'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Users, TrendingUp, AlertTriangle, DollarSign, Archive, Plus } from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalProducts: number;
  lowStockItems: number;
  totalUsers: number;
  totalValue: number;
  categoriesCount: number;
  locationsCount: number;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    lowStockItems: 0,
    totalUsers: 0,
    totalValue: 0,
    categoriesCount: 0,
    locationsCount: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Fetch real dashboard data from API
  const fetchDashboardStats = async () => {
    try {
      setLoadingStats(true);
      
      // Fetch multiple endpoints in parallel
      const [productsRes, usersRes, categoriesRes] = await Promise.all([
        fetch('/api/inventory').catch(() => null),
        fetch('/api/users').catch(() => null),
        fetch('/api/categories').catch(() => null)
      ]);

      let totalProducts = 0;
      let lowStockItems = 0;
      let totalValue = 0;

      // Process products data
      if (productsRes && productsRes.ok) {
        const products = await productsRes.json();
        totalProducts = products.length || 0;
        lowStockItems = products.filter((p: any) => p.quantity <= (p.minStockLevel || 5)).length;
        totalValue = products.reduce((sum: number, p: any) => sum + (p.price * p.quantity || 0), 0);
      }

      let totalUsers = 0;
      if (usersRes && usersRes.ok) {
        const users = await usersRes.json();
        totalUsers = users.length || 0;
      }

      let categoriesCount = 0;
      if (categoriesRes && categoriesRes.ok) {
        const categories = await categoriesRes.json();
        categoriesCount = categories.length || 0;
      }

      setStats({
        totalProducts,
        lowStockItems,
        totalUsers,
        totalValue,
        categoriesCount,
        locationsCount: 0 // Default for now
      });

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (!loading && user) {
      fetchDashboardStats();
    }
  }, [loading, user]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenido de vuelta, {user?.name || user?.email}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {user?.role}
          </Badge>
          <Button asChild size="sm">
            <Link href="/inventory/add">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Producto
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingStats ? '...' : stats.totalProducts.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              En inventario
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingStats ? '...' : stats.lowStockItems}
            </div>
            <p className="text-xs text-muted-foreground">
              Requieren atención
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingStats ? '...' : `$${stats.totalValue.toLocaleString()}`}
            </div>
            <p className="text-xs text-muted-foreground">
              Inventario valorizado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingStats ? '...' : stats.totalUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              Usuarios activos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumen del Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Categorías</span>
              <span className="font-medium">{loadingStats ? '...' : stats.categoriesCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estado del Sistema</span>
              <Badge variant="default" className="bg-green-500">Operativo</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/inventory">
                <Package className="h-4 w-4 mr-2" />
                Ver Inventario
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/categories">
                <Archive className="h-4 w-4 mr-2" />
                Gestionar Categorías
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/reports/low-stock">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Reporte Stock Bajo
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Overview */}
      {stats.lowStockItems > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertTriangle className="h-5 w-5" />
              Atención Requerida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700 dark:text-yellow-300">
              Hay {stats.lowStockItems} producto{stats.lowStockItems !== 1 ? 's' : ''} con stock bajo que requiere{stats.lowStockItems !== 1 ? 'n' : ''} reposición.
            </p>
            <Button asChild variant="outline" className="mt-3" size="sm">
              <Link href="/reports/low-stock">
                Ver Productos con Stock Bajo
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
