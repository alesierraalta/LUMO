import { notFound } from "next/navigation";
import { getProductById } from "@/services/productService";
import ProductForm from "@/components/products/product-form";
import ProductEditWrapper from "@/components/products/product-edit-wrapper";
import { getApiBaseUrl } from "@/lib/utils";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  // Access id directly but in a way that's compatible with future Next.js changes
  // In a future version, this would become: const id = React.use(params).id;
  const resolvedParams = await params;
  const { id } = resolvedParams;

  try {
    // Fetch product data from the server
    const product = await getProductById(id);

    if (!product) {
      notFound();
    }

    // Fetch categories from API with proper base URL
    const apiBaseUrl = getApiBaseUrl();
    const categoriesResponse = await fetch(`${apiBaseUrl}/api/categories`);
    if (!categoriesResponse.ok) {
      throw new Error('Failed to fetch categories');
    }
    const categories = await categoriesResponse.json();

    return (
      <div className="container max-w-5xl mx-auto py-8">
        <div className="mb-4">
          <Breadcrumb items={[
            { title: "Dashboard", href: "/dashboard" },
            { title: "Inventory", href: "/inventory" },
            { title: "Products", href: "/products" },
            { title: "Edit" }
          ]} />
        </div>
        
        <h1 className="text-3xl font-bold mb-8">Edit Product</h1>
        <ProductEditWrapper productId={id}>
          <ProductForm 
            initialData={product}
            categories={categories}
          />
        </ProductEditWrapper>
      </div>
    );
  } catch (error) {
    console.error("Error loading data:", error);
    return (
      <div className="container max-w-5xl mx-auto py-8">
        <div className="mb-4">
          <Breadcrumb items={[
            { title: "Dashboard", href: "/dashboard" },
            { title: "Inventory", href: "/inventory" },
            { title: "Products", href: "/products" },
            { title: "Edit" }
          ]} />
        </div>
        
        <div className="bg-destructive/20 text-destructive p-4 rounded-md mb-8">
          <p>Could not load product data.</p>
        </div>
      </div>
    );
  }
} 