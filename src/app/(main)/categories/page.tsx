'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, Package, TrendingUp, Archive, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CategoryList } from '@/components/categories/category-list';
import { CategorySearch } from '@/components/categories/category-search';
import type { Category } from '@/app/(main)/categories/columns';
import { apiGet } from '@/lib/api-client';

interface CategoryMetrics {
  totalCategories: number;
  totalProducts: number;
  averageProductsPerCategory: number;
  categoriesWithProducts: number;
  emptyCategories: number;
  mostPopularCategory: string;
}

export default function CategoriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<CategoryMetrics>({
    totalCategories: 0,
    totalProducts: 0,
    averageProductsPerCategory: 0,
    categoriesWithProducts: 0,
    emptyCategories: 0,
    mostPopularCategory: 'N/A'
  });

  const searchQuery = searchParams.get('q') || '';

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = categories.filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(categories);
    }
  }, [searchQuery, categories]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await apiGet('/api/categories');
      
      if (response.data?.success) {
        const categoriesData = response.data.categories || [];
        setCategories(categoriesData);
        calculateMetrics(categoriesData);
      } else if (response.error) {
        console.error('Categories API error:', response.error);
        toast({
          title: 'Authentication Error',
          description: response.status === 401
            ? 'Your session has expired. Please log in again.'
            : 'Failed to fetch categories',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch categories',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (categoriesData: Category[]) => {
    const totalCategories = categoriesData.length;
    const totalProducts = categoriesData.reduce((sum, cat) => sum + (cat._count?.inventoryItems || 0), 0);
    const categoriesWithProducts = categoriesData.filter(cat => (cat._count?.inventoryItems || 0) > 0).length;
    const emptyCategories = totalCategories - categoriesWithProducts;
    const averageProductsPerCategory = totalCategories > 0 ? Math.round(totalProducts / totalCategories * 100) / 100 : 0;
    
    const mostPopular = categoriesData.reduce((max, cat) => 
      (cat._count?.inventoryItems || 0) > (max._count?.inventoryItems || 0) ? cat : max, 
      categoriesData[0]
    );

    setMetrics({
      totalCategories,
      totalProducts,
      averageProductsPerCategory,
      categoriesWithProducts,
      emptyCategories,
      mostPopularCategory: mostPopular?.name || 'N/A'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading categories...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">
            Manage product categories and organize your inventory
          </p>
        </div>
        <Button onClick={() => router.push('/categories/new')} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <Archive className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalCategories}</div>
            <p className="text-xs text-muted-foreground">
              Active categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Across all categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Products</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageProductsPerCategory}</div>
            <p className="text-xs text-muted-foreground">
              Per category
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empty Categories</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.emptyCategories}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Category Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">With Products</span>
              <Badge variant="default">{metrics.categoriesWithProducts}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Empty</span>
              <Badge variant="secondary">{metrics.emptyCategories}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Most Popular</span>
              <Badge variant="outline" className="max-w-[120px] truncate">
                {metrics.mostPopularCategory}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full justify-start">
              <a href="/categories/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Category
              </a>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <a href="/products">
                <Package className="h-4 w-4 mr-2" />
                View All Products
              </a>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <a href="/reports">
                <TrendingUp className="h-4 w-4 mr-2" />
                Category Reports
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Database</span>
              <Badge className="bg-green-500">Online</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">API Status</span>
              <Badge className="bg-green-500">Active</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Last Updated</span>
              <span className="text-xs text-muted-foreground">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <CategorySearch />
        <div className="text-sm text-muted-foreground">
          {searchQuery ? (
            <>Showing {filteredCategories.length} of {categories.length} categories</>
          ) : (
            <>Showing all {categories.length} categories</>
          )}
        </div>
      </div>

      {/* Categories List */}
      {filteredCategories.length === 0 && !loading ? (
        <div className="text-center py-12">
          <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            {searchQuery ? 'No categories found matching your search.' : 'No categories found.'}
          </p>
          <Button onClick={() => router.push('/categories/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Category
          </Button>
        </div>
      ) : (
        <CategoryList categories={filteredCategories} />
      )}
    </div>
  );
} 