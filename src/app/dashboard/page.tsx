import { BarChart3, BoxIcon, ClipboardList } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, StatCard } from "@/components/ui/card";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Generate Report
          </button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Products"
          value="128"
          description="Total products in inventory"
          icon={<BoxIcon className="h-5 w-5" />}
          trend="up"
          trendValue="12% from last month"
          href="/products"
          linkText="View all products"
        />
        
        <StatCard
          title="Low Stock Items"
          value="12"
          description="Items below minimum stock level"
          icon={<ClipboardList className="h-5 w-5" />}
          trend="down"
          trendValue="3% from last month"
          href="/inventory"
          linkText="Manage inventory"
        />
        
        <StatCard
          title="Total Categories"
          value="8"
          description="Product categories"
          icon={<BarChart3 className="h-5 w-5" />}
          href="/products"
          linkText="View categories"
        />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest inventory changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 rounded-lg border p-4">
                <div className="flex-1 space-y-1">
                  <p className="font-medium">Product Added</p>
                  <p className="text-sm text-muted-foreground">Laptop XPS 15 added to inventory</p>
                </div>
                <div className="text-sm text-muted-foreground">2 hours ago</div>
              </div>
              <div className="flex items-start gap-4 rounded-lg border p-4">
                <div className="flex-1 space-y-1">
                  <p className="font-medium">Stock Updated</p>
                  <p className="text-sm text-muted-foreground">Stock levels updated for 5 items</p>
                </div>
                <div className="text-sm text-muted-foreground">Yesterday</div>
              </div>
              <div className="flex items-start gap-4 rounded-lg border p-4">
                <div className="flex-1 space-y-1">
                  <p className="font-medium">Category Created</p>
                  <p className="text-sm text-muted-foreground">New category created: Electronics</p>
                </div>
                <div className="text-sm text-muted-foreground">3 days ago</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common inventory tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Link 
                href="/products" 
                className="flex items-center gap-2 rounded-md border p-3 text-sm font-medium hover:bg-secondary"
              >
                <BoxIcon className="h-5 w-5" />
                <span>Add new product</span>
              </Link>
              <Link 
                href="/inventory" 
                className="flex items-center gap-2 rounded-md border p-3 text-sm font-medium hover:bg-secondary"
              >
                <ClipboardList className="h-5 w-5" />
                <span>Update stock levels</span>
              </Link>
              <Link 
                href="/dashboard" 
                className="flex items-center gap-2 rounded-md border p-3 text-sm font-medium hover:bg-secondary"
              >
                <BarChart3 className="h-5 w-5" />
                <span>View sales report</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 