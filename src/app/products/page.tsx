import Link from "next/link";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

export default function ProductsPage() {
  // Mock product data
  const products = [
    { id: 1, name: "Laptop", category: "Electronics", stock: 24, price: 999.99 },
    { id: 2, name: "Desk Chair", category: "Furniture", stock: 15, price: 189.50 },
    { id: 3, name: "Coffee Maker", category: "Appliances", stock: 8, price: 49.99 },
    { id: 4, name: "Wireless Mouse", category: "Electronics", stock: 32, price: 29.95 },
    { id: 5, name: "Headphones", category: "Electronics", stock: 18, price: 159.00 },
  ];

  return (
    <div className="container max-w-7xl mx-auto space-y-6 p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New Product
        </Button>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Product Catalog</CardTitle>
          <CardDescription>
            View and manage all products in your inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                type="text" 
                placeholder="Search products..." 
                className="pl-9 w-full"
              />
            </div>
          </div>
          
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead className="min-w-[150px]">Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id} className="group">
                    <TableCell className="font-medium">{product.id}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        product.stock < 10 
                          ? "bg-destructive/20 text-destructive" 
                          : product.stock < 20 
                          ? "bg-warning/20 text-warning-foreground" 
                          : "bg-success/20 text-success"
                      }`}>
                        {product.stock}
                      </span>
                    </TableCell>
                    <TableCell>${product.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-70 group-hover:opacity-100">
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-70 group-hover:opacity-100">
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
            Back to Home
          </Link>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-primary">
            View Dashboard
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
} 