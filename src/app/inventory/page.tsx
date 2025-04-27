import Link from "next/link";
import { Search, Settings, FileBarChart, ClipboardList } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function InventoryPage() {
  // Mock inventory data
  const inventoryItems = [
    { id: 1, productName: "Laptop", currentStock: 24, minStockLevel: 10, status: "In Stock", lastUpdated: "2023-10-15" },
    { id: 2, productName: "Desk Chair", currentStock: 15, minStockLevel: 5, status: "In Stock", lastUpdated: "2023-10-12" },
    { id: 3, productName: "Coffee Maker", currentStock: 8, minStockLevel: 10, status: "Low Stock", lastUpdated: "2023-10-08" },
    { id: 4, productName: "Wireless Mouse", currentStock: 32, minStockLevel: 15, status: "In Stock", lastUpdated: "2023-10-14" },
    { id: 5, productName: "Headphones", currentStock: 3, minStockLevel: 10, status: "Low Stock", lastUpdated: "2023-10-10" },
  ];

  return (
    <div className="container max-w-7xl mx-auto space-y-6 p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">Track and manage your inventory stock levels</p>
        </div>
        <Button className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Update Stock Levels
        </Button>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Inventory Status</CardTitle>
          <CardDescription>
            Monitor stock levels and set reorder points
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Select defaultValue="all">
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="low">Low Stock</SelectItem>
                  <SelectItem value="out">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="text" 
                  placeholder="Search inventory..." 
                  className="pl-9 w-full sm:w-[220px]"
                />
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <FileBarChart className="h-4 w-4" />
                Export
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Report
              </Button>
            </div>
          </div>
          
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead className="min-w-[150px]">Product</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Min Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryItems.map((item) => (
                  <TableRow key={item.id} className="group">
                    <TableCell className="font-medium">{item.id}</TableCell>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell>{item.currentStock}</TableCell>
                    <TableCell>{item.minStockLevel}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.status === "Low Stock" 
                          ? "bg-warning/20 text-warning-foreground" 
                          : item.status === "Out of Stock" 
                          ? "bg-destructive/20 text-destructive" 
                          : "bg-success/20 text-success"
                      }`}>
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell>{item.lastUpdated}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 opacity-70 group-hover:opacity-100">
                        Adjust
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <div className="flex gap-4">
            <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
              Back to Home
            </Link>
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-primary">
              Dashboard
            </Link>
          </div>
          <Link href="/products" className="text-sm text-muted-foreground hover:text-primary">
            View Products
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
} 