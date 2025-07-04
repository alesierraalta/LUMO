'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, Package, TrendingUp, AlertTriangle, DollarSign, BarChart3, Download, Upload, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import InventoryTable from '@/components/inventory/inventory-table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface InventoryMetrics {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  averageMargin: number;
  topCategory: string;
  recentMovements: number;
  totalRevenue: number;
}

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  description?: string;
  currentStock: number;
  minStockLevel: number;
  cost: number;
  price: number;
  category?: {
    id: string;
    name: string;
  };
  location?: {
    id: string;
    name: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function InventoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [metrics, setMetrics] = useState<InventoryMetrics>({
    totalItems: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    averageMargin: 0,
    topCategory: '',
    recentMovements: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch inventory items
      const inventoryResponse = await fetch('/api/inventory');
      const inventoryData = await inventoryResponse.json();
      
      // Fetch categories for filter
      const categoriesResponse = await fetch('/api/categories');
      const categoriesData = await categoriesResponse.json();
      
      if (inventoryData.success) {
        const inventoryItems = inventoryData.items || [];
        setItems(inventoryItems);
        calculateMetrics(inventoryItems);
      }
      
      if (categoriesData.success) {
        setCategories(categoriesData.categories || []);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch inventory data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (inventoryItems: InventoryItem[]) => {
    const totalItems = inventoryItems.length;
    const totalValue = inventoryItems.reduce((sum, item) => sum + (item.currentStock * item.cost), 0);
    const lowStockItems = inventoryItems.filter(item => item.currentStock <= item.minStockLevel && item.currentStock > 0).length;
    const outOfStockItems = inventoryItems.filter(item => item.currentStock <= 0).length;
    
    const margins = inventoryItems.map(item => {
      if (item.cost <= 0) return 0;
      return ((item.price - item.cost) / item.cost) * 100;
    });
    const averageMargin = margins.length > 0 ? margins.reduce((sum, margin) => sum + margin, 0) / margins.length : 0;
    
    // Find top category
    const categoryCount: {[key: string]: number} = {};
    inventoryItems.forEach(item => {
      if (item.category) {
        categoryCount[item.category.name] = (categoryCount[item.category.name] || 0) + 1;
      }
    });
    const topCategory = Object.keys(categoryCount).reduce((a, b) => categoryCount[a] > categoryCount[b] ? a : b, '');
    
    const totalRevenue = inventoryItems.reduce((sum, item) => sum + (item.currentStock * item.price), 0);
    
    setMetrics({
      totalItems,
      totalValue,
      lowStockItems,
      outOfStockItems,
      averageMargin,
      topCategory,
      recentMovements: 0, // This would come from movements API
      totalRevenue
    });
  };

  const getFilteredItems = () => {
    return items.filter(item => {
      // Search filter
      const matchesSearch = !searchTerm || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Category filter
      const matchesCategory = categoryFilter === 'all' || item.category?.id === categoryFilter;
      
      // Stock filter
      let matchesStock = true;
      if (stockFilter === 'low') matchesStock = item.currentStock <= item.minStockLevel && item.currentStock > 0;
      else if (stockFilter === 'out') matchesStock = item.currentStock <= 0;
      else if (stockFilter === 'normal') matchesStock = item.currentStock > item.minStockLevel;
      
      return matchesSearch && matchesCategory && matchesStock;
    });
  };

  const handleExport = () => {
    // Export functionality
    toast({
      title: 'Export',
      description: 'Export functionality will be implemented soon'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading inventory dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const filteredItems = getFilteredItems();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory Dashboard</h1>
          <p className="text-muted-foreground">
            Complete inventory management with analytics and insights
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/inventory/import')}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => router.push('/inventory/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalItems}</div>
            <p className="text-xs text-muted-foreground">
              Active inventory items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Current inventory value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics.lowStockItems + metrics.outOfStockItems}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.lowStockItems} low, {metrics.outOfStockItems} out
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics.averageMargin.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Profit margin average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue Potential</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              ${metrics.totalRevenue.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Total value if all inventory sold at current prices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {metrics.topCategory || 'N/A'}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Category with most items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Stock Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Healthy Stock:</span>
                <Badge variant="default">
                  {metrics.totalItems - metrics.lowStockItems - metrics.outOfStockItems}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Low Stock:</span>
                <Badge variant="secondary">{metrics.lowStockItems}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Out of Stock:</span>
                <Badge variant="destructive">{metrics.outOfStockItems}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Search items, SKU, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Stock Status</label>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock</SelectItem>
                  <SelectItem value="normal">Normal Stock</SelectItem>
                  <SelectItem value="low">Low Stock</SelectItem>
                  <SelectItem value="out">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setStockFilter('all');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Inventory Items ({filteredItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <InventoryTable 
            inventoryItems={filteredItems.map(item => ({
              ...item,
              quantity: item.currentStock,
              categoryId: item.category?.id,
              lastUpdated: item.updatedAt,
              active: item.isActive,
              margin: item.cost > 0 ? ((item.price - item.cost) / item.cost) * 100 : 0
            }))}
            allCategories={categories}
            activeTab={'all'}
          />
        </CardContent>
      </Card>
    </div>
  );
} 